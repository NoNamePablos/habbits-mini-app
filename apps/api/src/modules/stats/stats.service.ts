import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { HabitCompletion } from '../habits/entities/habit-completion.entity';
import { Habit } from '../habits/entities/habit.entity';
import { XpTransaction } from '../gamification/entities/xp-transaction.entity';

export interface DaySummary {
  date: string;
  completed: number;
  total: number;
}

export interface StatsSummary {
  weeklyCompletions: number;
  monthlyCompletions: number;
  prevWeekCompletions: number;
  prevMonthCompletions: number;
  weeklyDays: DaySummary[];
  currentActiveHabits: number;
  bestStreakOverall: number;
}

export interface HeatmapDay {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface HabitStats {
  totalCompletions: number;
  weeklyCompletions: number;
  heatmap: HeatmapDay[];
  weeklyData: DaySummary[];
}

export interface WeeklySummaryData {
  totalCompletions: number;
  totalPossible: number;
  perfectDays: number;
  bestStreak: number;
  xpEarned: number;
  weeklyDays: DaySummary[];
}

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(HabitCompletion)
    private readonly completionsRepo: Repository<HabitCompletion>,
    @InjectRepository(Habit)
    private readonly habitsRepo: Repository<Habit>,
    @InjectRepository(XpTransaction)
    private readonly xpTransRepo: Repository<XpTransaction>,
  ) {}

  async getSummary(userId: number): Promise<StatsSummary> {
    const today = new Date();
    const weekAgo = this.addDays(today, -7);
    const monthAgo = this.addDays(today, -30);
    const twoWeeksAgo = this.addDays(today, -14);
    const twoMonthsAgo = this.addDays(today, -60);

    const weekStr = this.formatDate(weekAgo);
    const monthStr = this.formatDate(monthAgo);
    const twoWeeksStr = this.formatDate(twoWeeksAgo);
    const twoMonthsStr = this.formatDate(twoMonthsAgo);
    const todayStr = this.formatDate(today);
    const weekAgoStr = this.formatDate(this.addDays(weekAgo, -1));
    const monthAgoStr = this.formatDate(this.addDays(monthAgo, -1));

    const [
      weeklyCompletions,
      monthlyCompletions,
      prevWeekCompletions,
      prevMonthCompletions,
      activeHabits,
      weekCompletions,
    ] = await Promise.all([
      this.completionsRepo.count({
        where: { userId, completedDate: Between(weekStr, todayStr) },
      }),
      this.completionsRepo.count({
        where: { userId, completedDate: Between(monthStr, todayStr) },
      }),
      this.completionsRepo.count({
        where: { userId, completedDate: Between(twoWeeksStr, weekAgoStr) },
      }),
      this.completionsRepo.count({
        where: { userId, completedDate: Between(twoMonthsStr, monthAgoStr) },
      }),
      this.habitsRepo.find({
        where: { userId, isActive: true },
      }),
      this.completionsRepo.find({
        where: { userId, completedDate: Between(weekStr, todayStr) },
        select: ['completedDate'],
      }),
    ]);

    const bestStreakOverall = activeHabits.reduce(
      (max, h) => Math.max(max, h.bestStreak),
      0,
    );

    // Build weekly days from fetched data (single query instead of 7)
    const countByDate = new Map<string, number>();
    for (const c of weekCompletions) {
      countByDate.set(
        c.completedDate,
        (countByDate.get(c.completedDate) ?? 0) + 1,
      );
    }

    const weeklyDays: DaySummary[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = this.formatDate(this.addDays(today, -i));
      weeklyDays.push({
        date,
        completed: countByDate.get(date) ?? 0,
        total: activeHabits.length,
      });
    }

    return {
      weeklyCompletions,
      monthlyCompletions,
      prevWeekCompletions,
      prevMonthCompletions,
      weeklyDays,
      currentActiveHabits: activeHabits.length,
      bestStreakOverall,
    };
  }

  async getWeeklySummary(userId: number): Promise<WeeklySummaryData> {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const offsetToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const lastMonday = this.addDays(today, offsetToMonday - 7);
    const lastSunday = this.addDays(today, offsetToMonday - 1);
    const lastMondayStr = this.formatDate(lastMonday);
    const lastSundayStr = this.formatDate(lastSunday);

    const thisMondayDate = this.addDays(today, offsetToMonday);

    const [activeHabits, completions, xpResult] = await Promise.all([
      this.habitsRepo.find({ where: { userId, isActive: true } }),
      this.completionsRepo.find({
        where: {
          userId,
          completedDate: Between(lastMondayStr, lastSundayStr),
        },
        select: ['completedDate'],
      }),
      this.xpTransRepo
        .createQueryBuilder('tx')
        .select('COALESCE(SUM(tx.amount), 0)', 'total')
        .where('tx.userId = :userId', { userId })
        .andWhere('tx.createdAt >= :from', { from: lastMonday })
        .andWhere('tx.createdAt < :to', { to: thisMondayDate })
        .getRawOne<{ total: string }>(),
    ]);

    const totalHabits = activeHabits.length;
    const bestStreak = activeHabits.reduce(
      (max, h) => Math.max(max, h.bestStreak),
      0,
    );

    const countByDate = new Map<string, number>();
    for (const c of completions) {
      countByDate.set(
        c.completedDate,
        (countByDate.get(c.completedDate) ?? 0) + 1,
      );
    }

    const weeklyDays: DaySummary[] = [];
    let perfectDays = 0;

    for (let i = 0; i < 7; i++) {
      const date = this.formatDate(this.addDays(lastMonday, i));
      const completed = countByDate.get(date) ?? 0;
      weeklyDays.push({ date, completed, total: totalHabits });
      if (totalHabits > 0 && completed >= totalHabits) {
        perfectDays++;
      }
    }

    return {
      totalCompletions: completions.length,
      totalPossible: totalHabits * 7,
      perfectDays,
      bestStreak,
      xpEarned: parseInt(xpResult?.total ?? '0', 10),
      weeklyDays,
    };
  }

  async getHeatmap(userId: number, months: number = 3): Promise<HeatmapDay[]> {
    const safeMonths = Math.min(Math.max(months, 1), 12);
    const today = new Date();
    const startDate = this.addDays(today, -(safeMonths * 30));
    const startStr = this.formatDate(startDate);
    const todayStr = this.formatDate(today);

    const completions = await this.completionsRepo.find({
      where: {
        userId,
        completedDate: Between(startStr, todayStr),
      },
    });

    // Count completions per day
    const countMap = new Map<string, number>();
    for (const c of completions) {
      const current = countMap.get(c.completedDate) ?? 0;
      countMap.set(c.completedDate, current + 1);
    }

    // Find max for level calculation
    const maxCount = Math.max(...Array.from(countMap.values()), 1);

    // Build heatmap array
    const heatmap: HeatmapDay[] = [];
    const totalDays = safeMonths * 30;
    for (let i = totalDays; i >= 0; i--) {
      const date = this.formatDate(this.addDays(today, -i));
      const count = countMap.get(date) ?? 0;
      const level = this.getHeatmapLevel(count, maxCount);
      heatmap.push({ date, count, level });
    }

    return heatmap;
  }

  async getHabitStats(habitId: number, userId: number): Promise<HabitStats> {
    const today = new Date();
    const weekAgo = this.addDays(today, -7);
    const threeMonthsAgo = this.addDays(today, -90);

    const [totalCompletions, weeklyCompletions, completions] =
      await Promise.all([
        this.completionsRepo.count({
          where: { habitId, userId },
        }),
        this.completionsRepo.count({
          where: {
            habitId,
            userId,
            completedDate: Between(
              this.formatDate(weekAgo),
              this.formatDate(today),
            ),
          },
        }),
        this.completionsRepo.find({
          where: {
            habitId,
            userId,
            completedDate: Between(
              this.formatDate(threeMonthsAgo),
              this.formatDate(today),
            ),
          },
        }),
      ]);

    const countMap = new Map<string, number>();
    for (const c of completions) {
      countMap.set(c.completedDate, 1);
    }

    const heatmap: HeatmapDay[] = [];
    for (let i = 90; i >= 0; i--) {
      const date = this.formatDate(this.addDays(today, -i));
      const count = countMap.get(date) ?? 0;
      heatmap.push({
        date,
        count,
        level: count > 0 ? 4 : 0,
      });
    }

    // Weekly data
    const weeklyData: DaySummary[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = this.formatDate(this.addDays(today, -i));
      const completed = countMap.has(date) ? 1 : 0;
      weeklyData.push({ date, completed, total: 1 });
    }

    return {
      totalCompletions,
      weeklyCompletions,
      heatmap,
      weeklyData,
    };
  }

  private getHeatmapLevel(count: number, maxCount: number): 0 | 1 | 2 | 3 | 4 {
    if (count === 0) return 0;
    const ratio = count / maxCount;
    if (ratio <= 0.25) return 1;
    if (ratio <= 0.5) return 2;
    if (ratio <= 0.75) return 3;
    return 4;
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }
}
