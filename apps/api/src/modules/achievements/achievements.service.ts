import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Achievement,
  AchievementCriteria,
} from './entities/achievement.entity';
import { UserAchievement } from './entities/user-achievement.entity';
import { GamificationService } from '../gamification/gamification.service';
import { Habit, TimeOfDay } from '../habits/entities/habit.entity';
import { HabitCompletion } from '../habits/entities/habit-completion.entity';

interface AchievementWithStatus extends Achievement {
  unlocked: boolean;
  unlockedAt: Date | null;
}

interface UnlockedAchievement {
  achievement: Achievement;
  xpAwarded: number;
}

interface CompletionContext {
  userId: number;
  habitId: number;
  currentStreak: number;
}

const SEED_ACHIEVEMENTS: Array<{
  key: string;
  name: string;
  description: string;
  icon: string;
  category: Achievement['category'];
  criteria: AchievementCriteria;
  xpReward: number;
}> = [
  {
    key: 'first_step',
    name: 'Первый шаг',
    description: 'Создай первую привычку',
    icon: 'Footprints',
    category: 'completion',
    criteria: { type: 'habit_count', value: 1 },
    xpReward: 20,
  },
  {
    key: 'first_complete',
    name: 'Готово!',
    description: 'Первое выполнение привычки',
    icon: 'CheckCircle',
    category: 'completion',
    criteria: { type: 'total_completions', value: 1 },
    xpReward: 20,
  },
  {
    key: 'week_warrior',
    name: 'Воин недели',
    description: '7-дневный стрик',
    icon: 'Sword',
    category: 'streak',
    criteria: { type: 'streak', value: 7 },
    xpReward: 50,
  },
  {
    key: 'month_master',
    name: 'Мастер месяца',
    description: '30-дневный стрик',
    icon: 'Crown',
    category: 'streak',
    criteria: { type: 'streak', value: 30 },
    xpReward: 100,
  },
  {
    key: 'fifty_done',
    name: 'Полтинник',
    description: '50 выполнений одной привычки',
    icon: 'Medal',
    category: 'completion',
    criteria: { type: 'total_completions', value: 50 },
    xpReward: 50,
  },
  {
    key: 'early_bird',
    name: 'Жаворонок',
    description: '7 утренних отметок подряд',
    icon: 'Sunrise',
    category: 'time',
    criteria: { type: 'morning_streak', value: 7 },
    xpReward: 50,
  },
  {
    key: 'collector',
    name: 'Коллекционер',
    description: '5 активных привычек',
    icon: 'LayoutGrid',
    category: 'completion',
    criteria: { type: 'habit_count', value: 5 },
    xpReward: 30,
  },
  {
    key: 'perfectionist',
    name: 'Перфекционист',
    description: 'Все привычки за день',
    icon: 'Star',
    category: 'completion',
    criteria: { type: 'perfect_day', value: 1 },
    xpReward: 30,
  },
];

@Injectable()
export class AchievementsService implements OnModuleInit {
  constructor(
    @InjectRepository(Achievement)
    private readonly achievementsRepo: Repository<Achievement>,
    @InjectRepository(UserAchievement)
    private readonly userAchievementsRepo: Repository<UserAchievement>,
    @InjectRepository(Habit)
    private readonly habitsRepo: Repository<Habit>,
    @InjectRepository(HabitCompletion)
    private readonly completionsRepo: Repository<HabitCompletion>,
    private readonly gamificationService: GamificationService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seedAchievements();
  }

  private async seedAchievements(): Promise<void> {
    for (const seed of SEED_ACHIEVEMENTS) {
      const exists = await this.achievementsRepo.findOne({
        where: { key: seed.key },
      });
      if (!exists) {
        await this.achievementsRepo.save(this.achievementsRepo.create(seed));
      }
    }
  }

  async getAllForUser(userId: number): Promise<AchievementWithStatus[]> {
    const achievements = await this.achievementsRepo.find({
      order: { id: 'ASC' },
    });

    const unlocked = await this.userAchievementsRepo.find({
      where: { userId },
    });

    const unlockedMap = new Map(
      unlocked.map((ua) => [ua.achievementId, ua.unlockedAt]),
    );

    return achievements.map((a) => ({
      ...a,
      unlocked: unlockedMap.has(a.id),
      unlockedAt: unlockedMap.get(a.id) ?? null,
    }));
  }

  async checkAfterCompletion(
    ctx: CompletionContext,
  ): Promise<UnlockedAchievement[]> {
    const [achievements, userAchievements] = await Promise.all([
      this.achievementsRepo.find(),
      this.userAchievementsRepo.find({ where: { userId: ctx.userId } }),
    ]);

    const unlockedIds = new Set(userAchievements.map((ua) => ua.achievementId));
    const results: UnlockedAchievement[] = [];

    for (const achievement of achievements) {
      if (unlockedIds.has(achievement.id)) continue;

      const met = await this.checkCriteria(achievement.criteria, ctx);
      if (met) {
        const ua = this.userAchievementsRepo.create({
          userId: ctx.userId,
          achievementId: achievement.id,
        });
        await this.userAchievementsRepo.save(ua);

        await this.gamificationService.awardXp(
          ctx.userId,
          achievement.xpReward,
          'achievement',
          achievement.id,
        );

        results.push({ achievement, xpAwarded: achievement.xpReward });
      }
    }

    return results;
  }

  async checkAfterHabitCreated(userId: number): Promise<UnlockedAchievement[]> {
    const [habitCount, achievements, userAchievements] = await Promise.all([
      this.habitsRepo.count({ where: { userId, isActive: true } }),
      this.achievementsRepo.find(),
      this.userAchievementsRepo.find({ where: { userId } }),
    ]);

    const unlockedIds = new Set(userAchievements.map((ua) => ua.achievementId));
    const results: UnlockedAchievement[] = [];

    for (const achievement of achievements) {
      if (achievement.criteria.type !== 'habit_count') continue;
      if (unlockedIds.has(achievement.id)) continue;

      if (habitCount >= achievement.criteria.value) {
        const ua = this.userAchievementsRepo.create({
          userId,
          achievementId: achievement.id,
        });
        await this.userAchievementsRepo.save(ua);

        await this.gamificationService.awardXp(
          userId,
          achievement.xpReward,
          'achievement',
          achievement.id,
        );

        results.push({ achievement, xpAwarded: achievement.xpReward });
      }
    }

    return results;
  }

  private async checkCriteria(
    criteria: AchievementCriteria,
    ctx: CompletionContext,
  ): Promise<boolean> {
    switch (criteria.type) {
      case 'streak':
        return ctx.currentStreak >= criteria.value;

      case 'total_completions': {
        const count = await this.completionsRepo.count({
          where: { habitId: ctx.habitId },
        });
        return count >= criteria.value;
      }

      case 'habit_count': {
        const habitCount = await this.habitsRepo.count({
          where: { userId: ctx.userId, isActive: true },
        });
        return habitCount >= criteria.value;
      }

      case 'perfect_day': {
        const totalHabits = await this.habitsRepo.count({
          where: { userId: ctx.userId, isActive: true },
        });
        const today = new Date().toISOString().split('T')[0];
        const todayCompletions = await this.completionsRepo.count({
          where: { userId: ctx.userId, completedDate: today },
        });
        return totalHabits > 0 && todayCompletions >= totalHabits;
      }

      case 'morning_streak': {
        const habit = await this.habitsRepo.findOne({
          where: { id: ctx.habitId },
        });
        if (habit?.timeOfDay !== TimeOfDay.MORNING) return false;
        return ctx.currentStreak >= criteria.value;
      }

      default:
        return false;
    }
  }
}
