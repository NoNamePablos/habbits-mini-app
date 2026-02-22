import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Habit } from './entities/habit.entity';
import { HabitCompletion } from './entities/habit-completion.entity';
import { CreateHabitDto } from './dto/create-habit.dto';
import { UpdateHabitDto } from './dto/update-habit.dto';
import { CompleteHabitDto } from './dto/complete-habit.dto';
import { GamificationService } from '../gamification/gamification.service';
import { AchievementsService } from '../achievements/achievements.service';
import { Achievement } from '../achievements/entities/achievement.entity';

const XP_PER_COMPLETION = 10;

interface UnlockedAchievementInfo {
  achievement: Achievement;
  xpAwarded: number;
}

interface CompletionResult {
  completion: HabitCompletion;
  habit: Habit;
  xpEarned: number;
  streakBonusXp: number;
  leveledUp: boolean;
  newLevel: number;
  unlockedAchievements: UnlockedAchievementInfo[];
}

@Injectable()
export class HabitsService {
  constructor(
    @InjectRepository(Habit)
    private readonly habitsRepo: Repository<Habit>,
    @InjectRepository(HabitCompletion)
    private readonly completionsRepo: Repository<HabitCompletion>,
    private readonly dataSource: DataSource,
    private readonly gamificationService: GamificationService,
    private readonly achievementsService: AchievementsService,
  ) {}

  async findAllByUser(userId: number): Promise<Habit[]> {
    return this.habitsRepo.find({
      where: { userId, isActive: true },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  async findOneOrFail(id: number, userId: number): Promise<Habit> {
    const habit = await this.habitsRepo.findOne({
      where: { id, userId },
    });
    if (!habit) {
      throw new NotFoundException('Habit not found');
    }
    return habit;
  }

  async create(userId: number, dto: CreateHabitDto): Promise<Habit> {
    const habit = this.habitsRepo.create({ ...dto, userId });
    const saved = await this.habitsRepo.save(habit);

    // Check habit_count achievements (first_step, collector)
    await this.achievementsService.checkAfterHabitCreated(userId);

    return saved;
  }

  async update(
    id: number,
    userId: number,
    dto: UpdateHabitDto,
  ): Promise<Habit> {
    const habit = await this.findOneOrFail(id, userId);
    Object.assign(habit, dto);
    return this.habitsRepo.save(habit);
  }

  async remove(id: number, userId: number): Promise<void> {
    const habit = await this.findOneOrFail(id, userId);
    await this.habitsRepo.remove(habit);
  }

  async complete(
    id: number,
    userId: number,
    dto: CompleteHabitDto,
    timezone: string = 'UTC',
  ): Promise<CompletionResult> {
    const habit = await this.findOneOrFail(id, userId);
    const today = this.getTodayDate(timezone);

    const existing = await this.completionsRepo.findOne({
      where: { habitId: id, completedDate: today },
    });
    if (existing) {
      throw new ConflictException('Already completed today');
    }

    // Calculate streak
    const streakData = await this.calculateStreak(id, today);
    habit.currentStreak = streakData.newStreak;
    if (habit.currentStreak > habit.bestStreak) {
      habit.bestStreak = habit.currentStreak;
    }

    // XP calculation
    const xpEarned = XP_PER_COMPLETION;
    const streakBonusXp = this.getStreakBonus(habit.currentStreak);

    const completion = this.completionsRepo.create({
      habitId: id,
      userId,
      completedDate: today,
      value: dto.value,
      note: dto.note,
      xpEarned: xpEarned + streakBonusXp,
    });

    // Save completion + habit in a transaction
    await this.dataSource.transaction(async (manager) => {
      await manager.save(completion);
      await manager.save(habit);
    });

    // Award XP via gamification engine
    const totalXp = xpEarned + streakBonusXp;
    const xpResult = await this.gamificationService.awardXp(
      userId,
      totalXp,
      'habit_complete',
      id,
    );

    // Check achievements
    const unlockedAchievements =
      await this.achievementsService.checkAfterCompletion({
        userId,
        habitId: id,
        currentStreak: habit.currentStreak,
      });

    return {
      completion,
      habit,
      xpEarned,
      streakBonusXp,
      leveledUp: xpResult.leveledUp,
      newLevel: xpResult.newLevel,
      unlockedAchievements,
    };
  }

  async uncomplete(id: number, userId: number, date: string): Promise<Habit> {
    const habit = await this.findOneOrFail(id, userId);

    const completion = await this.completionsRepo.findOne({
      where: { habitId: id, completedDate: date },
    });
    if (!completion) {
      throw new NotFoundException('Completion not found');
    }

    await this.completionsRepo.remove(completion);

    // Recalculate streak
    const recalculated = await this.recalculateStreak(id);
    habit.currentStreak = recalculated;
    return this.habitsRepo.save(habit);
  }

  async getTodayCompletions(
    userId: number,
    timezone: string = 'UTC',
  ): Promise<HabitCompletion[]> {
    const today = this.getTodayDate(timezone);
    return this.completionsRepo.find({
      where: { userId, completedDate: today },
    });
  }

  private async calculateStreak(
    habitId: number,
    today: string,
  ): Promise<{ newStreak: number }> {
    const yesterday = this.addDays(today, -1);
    const yesterdayCompletion = await this.completionsRepo.findOne({
      where: { habitId, completedDate: yesterday },
    });

    if (yesterdayCompletion) {
      const habit = await this.habitsRepo.findOneByOrFail({ id: habitId });
      return { newStreak: habit.currentStreak + 1 };
    }

    return { newStreak: 1 };
  }

  private async recalculateStreak(habitId: number): Promise<number> {
    const completions = await this.completionsRepo.find({
      where: { habitId },
      order: { completedDate: 'DESC' },
      take: 365,
    });

    if (completions.length === 0) return 0;

    let streak = 0;
    let expectedDate = this.getTodayDate();

    for (const completion of completions) {
      if (completion.completedDate === expectedDate) {
        streak++;
        expectedDate = this.addDays(expectedDate, -1);
      } else {
        break;
      }
    }

    return streak;
  }

  private getStreakBonus(streak: number): number {
    if (streak >= 30) return 200;
    if (streak >= 14) return 100;
    if (streak >= 7) return 50;
    return 0;
  }

  private getTodayDate(timezone: string = 'UTC'): string {
    return new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(
      new Date(),
    );
  }

  private addDays(dateStr: string, days: number): string {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  }
}
