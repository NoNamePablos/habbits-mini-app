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

  async getSummary(userId: number, timezone: string = 'UTC'): Promise<StatsSummary> {
    const todayStr = this.getTodayDate(timezone);
    const weekStr = this.addDays(todayStr, -7);
    const monthStr = this.addDays(todayStr, -30);
    const twoWeeksStr = this.addDays(todayStr, -14);
    const twoMonthsStr = this.addDays(todayStr, -60);
    const weekAgoStr = this.addDays(todayStr, -8);
    const monthAgoStr = this.addDays(todayStr, -31);

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

    const countByDate = new Map<string, number>();
    for (const c of weekCompletions) {
      countByDate.set(
        c.completedDate,
        (countByDate.get(c.completedDate) ?? 0) + 1,
      );
    }

    const weeklyDays: DaySummary[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = this.addDays(todayStr, -i);
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

  async getWeeklySummary(userId: number, timezone: string = 'UTC'): Promise<WeeklySummaryData> {
    const todayStr = this.getTodayDate(timezone);
    const todayDate = new Date(todayStr + 'T00:00:00');
    const dayOfWeek = todayDate.getDay();
    const offsetToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const lastMondayStr = this.addDays(todayStr, offsetToMonday - 7);
    const lastSundayStr = this.addDays(todayStr, offsetToMonday - 1);
    const thisMondayDate = new Date(this.addDays(todayStr, offsetToMonday) + 'T00:00:00');
    const lastMondayDate = new Date(lastMondayStr + 'T00:00:00');

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
        .andWhere('tx.createdAt >= :from', { from: lastMondayDate })
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
      const date = this.addDays(lastMondayStr, i);
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

  async getWeekDays(userId: number, timezone: string = 'UTC', weekOffset: number = 0): Promise<DaySummary[]> {
    const todayStr = this.getTodayDate(timezone);
    const todayDate = new Date(todayStr + 'T00:00:00');
    const dayOfWeek = todayDate.getDay();
    const offsetToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const weekStart = this.addDays(todayStr, offsetToMonday + weekOffset * 7);
    const weekEnd = this.addDays(weekStart, 6);

    const [activeHabits, completions] = await Promise.all([
      this.habitsRepo.find({ where: { userId, isActive: true } }),
      this.completionsRepo.find({
        where: { userId, completedDate: Between(weekStart, weekEnd) },
        select: ['completedDate'],
      }),
    ]);

    const countByDate = new Map<string, number>();
    for (const c of completions) {
      countByDate.set(c.completedDate, (countByDate.get(c.completedDate) ?? 0) + 1);
    }

    const days: DaySummary[] = [];
    for (let i = 0; i < 7; i++) {
      const date = this.addDays(weekStart, i);
      days.push({ date, completed: countByDate.get(date) ?? 0, total: activeHabits.length });
    }
    return days;
  }

  async getHeatmap(userId: number, months: number = 3, timezone: string = 'UTC'): Promise<HeatmapDay[]> {
    const safeMonths = Math.min(Math.max(months, 1), 12);
    const todayStr = this.getTodayDate(timezone);
    const startStr = this.addDays(todayStr, -(safeMonths * 30));

    const completions = await this.completionsRepo.find({
      where: {
        userId,
        completedDate: Between(startStr, todayStr),
      },
    });

    const countMap = new Map<string, number>();
    for (const c of completions) {
      const current = countMap.get(c.completedDate) ?? 0;
      countMap.set(c.completedDate, current + 1);
    }

    const maxCount = Math.max(...Array.from(countMap.values()), 1);

    const heatmap: HeatmapDay[] = [];
    const totalDays = safeMonths * 30;
    for (let i = totalDays; i >= 0; i--) {
      const date = this.addDays(todayStr, -i);
      const count = countMap.get(date) ?? 0;
      const level = this.getHeatmapLevel(count, maxCount);
      heatmap.push({ date, count, level });
    }

    return heatmap;
  }

  async getHabitStats(habitId: number, userId: number, timezone: string = 'UTC'): Promise<HabitStats> {
    const todayStr = this.getTodayDate(timezone);
    const weekAgoStr = this.addDays(todayStr, -7);
    const threeMonthsAgoStr = this.addDays(todayStr, -90);

    const [totalCompletions, weeklyCompletions, completions] =
      await Promise.all([
        this.completionsRepo.count({
          where: { habitId, userId },
        }),
        this.completionsRepo.count({
          where: {
            habitId,
            userId,
            completedDate: Between(weekAgoStr, todayStr),
          },
        }),
        this.completionsRepo.find({
          where: {
            habitId,
            userId,
            completedDate: Between(threeMonthsAgoStr, todayStr),
          },
        }),
      ]);

    const countMap = new Map<string, number>();
    for (const c of completions) {
      countMap.set(c.completedDate, 1);
    }

    const heatmap: HeatmapDay[] = [];
    for (let i = 90; i >= 0; i--) {
      const date = this.addDays(todayStr, -i);
      const count = countMap.get(date) ?? 0;
      heatmap.push({
        date,
        count,
        level: count > 0 ? 4 : 0,
      });
    }

    const weeklyData: DaySummary[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = this.addDays(todayStr, -i);
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

  private getTodayDate(timezone: string = 'UTC'): string {
    return new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(new Date());
  }

  private addDays(dateStr: string, days: number): string {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  }
}
