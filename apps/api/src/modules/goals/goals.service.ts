import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan } from 'typeorm';
import { Goal, GoalType, GoalStatus } from './entities/goal.entity';
import { Habit } from '../habits/entities/habit.entity';
import { HabitCompletion } from '../habits/entities/habit-completion.entity';
import { XpTransaction } from '../gamification/entities/xp-transaction.entity';
import { User } from '../users/entities/user.entity';
import { GamificationService } from '../gamification/gamification.service';
import { CreateGoalDto } from './dto/create-goal.dto';

export interface GoalWithProgress {
  goal: Goal;
  currentValue: number;
  progressPercent: number;
}

export interface GoalCompletionResult {
  goal: Goal;
  xpEarned: number;
  leveledUp: boolean;
  newLevel: number;
}

@Injectable()
export class GoalsService {
  constructor(
    @InjectRepository(Goal)
    private readonly goalsRepo: Repository<Goal>,
    @InjectRepository(Habit)
    private readonly habitsRepo: Repository<Habit>,
    @InjectRepository(HabitCompletion)
    private readonly completionsRepo: Repository<HabitCompletion>,
    @InjectRepository(XpTransaction)
    private readonly xpTransRepo: Repository<XpTransaction>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    private readonly gamificationService: GamificationService,
  ) {}

  async getActiveGoal(userId: number): Promise<GoalWithProgress | null> {
    const goal = await this.goalsRepo.findOne({
      where: { userId, status: GoalStatus.ACTIVE },
    });

    if (!goal) return null;

    // Auto-fail expired goals
    const today = new Date().toISOString().split('T')[0];
    if (goal.deadline < today) {
      goal.status = GoalStatus.FAILED;
      await this.goalsRepo.save(goal);
      return null;
    }

    const currentValue = await this.calculateProgress(goal, userId);
    const progressPercent = Math.min(
      Math.round((currentValue / goal.targetValue) * 100),
      100,
    );

    return { goal, currentValue, progressPercent };
  }

  async getHistory(userId: number): Promise<Goal[]> {
    return this.goalsRepo.find({
      where: [
        { userId, status: GoalStatus.COMPLETED },
        { userId, status: GoalStatus.FAILED },
      ],
      order: { createdAt: 'DESC' },
    });
  }

  async create(userId: number, dto: CreateGoalDto): Promise<Goal> {
    // Check no active goal
    const existing = await this.goalsRepo.findOne({
      where: { userId, status: GoalStatus.ACTIVE },
    });
    if (existing) {
      throw new ConflictException('Active goal already exists');
    }

    const today = new Date().toISOString().split('T')[0];
    const deadlineDate = new Date();
    deadlineDate.setDate(deadlineDate.getDate() + dto.durationDays - 1);
    const deadline = deadlineDate.toISOString().split('T')[0];

    const xpReward = this.calculateXpReward(
      dto.type,
      dto.targetValue,
      dto.durationDays,
    );

    const goal = this.goalsRepo.create({
      userId,
      type: dto.type,
      targetValue: dto.targetValue,
      durationDays: dto.durationDays,
      startDate: today,
      deadline,
      xpReward,
    });

    return this.goalsRepo.save(goal);
  }

  async abandon(goalId: number, userId: number): Promise<Goal> {
    const goal = await this.goalsRepo.findOne({
      where: { id: goalId, userId, status: GoalStatus.ACTIVE },
    });
    if (!goal) {
      throw new NotFoundException('Active goal not found');
    }

    goal.status = GoalStatus.FAILED;
    return this.goalsRepo.save(goal);
  }

  async checkAfterCompletion(
    userId: number,
  ): Promise<GoalCompletionResult | null> {
    const goal = await this.goalsRepo.findOne({
      where: { userId, status: GoalStatus.ACTIVE },
    });
    if (!goal) return null;

    const today = new Date().toISOString().split('T')[0];
    if (goal.deadline < today) {
      goal.status = GoalStatus.FAILED;
      await this.goalsRepo.save(goal);
      return null;
    }

    const currentValue = await this.calculateProgress(goal, userId);
    if (currentValue < goal.targetValue) return null;

    // Goal completed!
    goal.status = GoalStatus.COMPLETED;
    goal.completedAt = new Date();
    await this.goalsRepo.save(goal);

    // Award XP
    let leveledUp = false;
    let newLevel = 0;
    if (goal.xpReward > 0) {
      const xpResult = await this.gamificationService.awardXp(
        userId,
        goal.xpReward,
        'goal',
        goal.id,
      );
      leveledUp = xpResult.leveledUp;
      newLevel = xpResult.newLevel;
    }

    return {
      goal,
      xpEarned: goal.xpReward,
      leveledUp,
      newLevel,
    };
  }

  private async calculateProgress(
    goal: Goal,
    userId: number,
  ): Promise<number> {
    const today = new Date().toISOString().split('T')[0];

    switch (goal.type) {
      case GoalType.COMPLETION_RATE:
        return this.calcCompletionRate(userId, goal.startDate, today);

      case GoalType.STREAK_DAYS:
        return this.calcStreakDays(userId, goal.startDate, today);

      case GoalType.TOTAL_XP:
        return this.calcTotalXp(userId, goal.startDate);

      case GoalType.TOTAL_COMPLETIONS:
        return this.calcTotalCompletions(userId, goal.startDate, today);
    }
  }

  private async calcCompletionRate(
    userId: number,
    startDate: string,
    today: string,
  ): Promise<number> {
    const activeHabits = await this.habitsRepo.count({
      where: { userId, isActive: true },
    });
    if (activeHabits === 0) return 0;

    const completions = await this.completionsRepo.count({
      where: {
        userId,
        completedDate: Between(startDate, today),
      },
    });

    const daysDiff =
      Math.floor(
        (new Date(today).getTime() - new Date(startDate).getTime()) /
          86400000,
      ) + 1;
    const totalPossible = activeHabits * daysDiff;
    if (totalPossible === 0) return 0;

    return Math.round((completions / totalPossible) * 100);
  }

  private async calcStreakDays(
    userId: number,
    startDate: string,
    today: string,
  ): Promise<number> {
    const activeHabits = await this.habitsRepo.count({
      where: { userId, isActive: true },
    });
    if (activeHabits === 0) return 0;

    // Get completions grouped by date from startDate to today
    const completions = await this.completionsRepo
      .createQueryBuilder('c')
      .select('c.completedDate', 'date')
      .addSelect('COUNT(*)', 'cnt')
      .where('c.userId = :userId', { userId })
      .andWhere('c.completedDate >= :startDate', { startDate })
      .andWhere('c.completedDate <= :today', { today })
      .groupBy('c.completedDate')
      .orderBy('c.completedDate', 'DESC')
      .getRawMany<{ date: string; cnt: string }>();

    const completionMap = new Map<string, number>();
    for (const row of completions) {
      completionMap.set(row.date, parseInt(row.cnt, 10));
    }

    // Count consecutive perfect days going backwards from today
    let streak = 0;
    const current = new Date(today);
    const start = new Date(startDate);

    while (current >= start) {
      const dateStr = current.toISOString().split('T')[0];
      const count = completionMap.get(dateStr) ?? 0;
      if (count >= activeHabits) {
        streak++;
      } else {
        break;
      }
      current.setDate(current.getDate() - 1);
    }

    return streak;
  }

  private async calcTotalXp(
    userId: number,
    startDate: string,
  ): Promise<number> {
    const result = await this.xpTransRepo
      .createQueryBuilder('tx')
      .select('COALESCE(SUM(tx.amount), 0)', 'total')
      .where('tx.userId = :userId', { userId })
      .andWhere('tx.createdAt >= :startDate', {
        startDate: `${startDate} 00:00:00`,
      })
      .getRawOne<{ total: string }>();

    return parseInt(result?.total ?? '0', 10);
  }

  private async calcTotalCompletions(
    userId: number,
    startDate: string,
    today: string,
  ): Promise<number> {
    return this.completionsRepo.count({
      where: {
        userId,
        completedDate: Between(startDate, today),
      },
    });
  }

  private calculateXpReward(
    type: GoalType,
    targetValue: number,
    durationDays: number,
  ): number {
    switch (type) {
      case GoalType.COMPLETION_RATE:
        return Math.min(
          Math.round((targetValue * durationDays) / 30),
          300,
        );
      case GoalType.STREAK_DAYS:
        return Math.min(targetValue * 5, 300);
      case GoalType.TOTAL_XP:
        return 0; // avoid circular XP rewards
      case GoalType.TOTAL_COMPLETIONS:
        return Math.min(Math.round(targetValue * 2), 300);
    }
  }
}
