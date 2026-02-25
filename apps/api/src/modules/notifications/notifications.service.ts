import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Telegraf } from 'telegraf';
import { NotificationPreference } from './notification-preference.entity';
import { User } from '../users/entities/user.entity';
import { Habit } from '../habits/entities/habit.entity';
import { HabitCompletion } from '../habits/entities/habit-completion.entity';

interface UserNotificationData {
  telegramId: number;
  languageCode: string | null;
  timezone: string;
  totalHabits: number;
  completedToday: number;
  bestStreak: number;
}

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);
  private bot: Telegraf;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(NotificationPreference)
    private readonly preferencesRepo: Repository<NotificationPreference>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(Habit)
    private readonly habitsRepo: Repository<Habit>,
    @InjectRepository(HabitCompletion)
    private readonly completionsRepo: Repository<HabitCompletion>,
  ) {
    const token = this.configService.getOrThrow<string>('TELEGRAM_BOT_TOKEN');
    this.bot = new Telegraf(token);
  }

  onModuleInit(): void {
    this.logger.log('Notifications service initialized');
  }

  async getPreferences(userId: number): Promise<NotificationPreference> {
    let prefs = await this.preferencesRepo.findOne({ where: { userId } });
    if (!prefs) {
      prefs = this.preferencesRepo.create({ userId });
      prefs = await this.preferencesRepo.save(prefs);
    }
    return prefs;
  }

  async updatePreferences(
    userId: number,
    data: Partial<Pick<NotificationPreference, 'morningEnabled' | 'eveningEnabled' | 'morningTime' | 'eveningTime'>>,
  ): Promise<NotificationPreference> {
    let prefs = await this.preferencesRepo.findOne({ where: { userId } });
    if (!prefs) {
      prefs = this.preferencesRepo.create({ userId, ...data });
    } else {
      Object.assign(prefs, data);
    }
    return this.preferencesRepo.save(prefs);
  }

  async sendMorningReminders(): Promise<void> {
    const users = await this.getUsersForTimeSlot('morning');

    for (const userData of users) {
      const message = this.buildMorningMessage(userData);
      await this.sendMessage(userData.telegramId, message);
    }

    if (users.length > 0) {
      this.logger.log(`Sent ${users.length} morning reminders`);
    }
  }

  async sendEveningReminders(): Promise<void> {
    const users = await this.getUsersForTimeSlot('evening');

    for (const userData of users) {
      if (userData.completedToday >= userData.totalHabits) continue;

      const message = this.buildEveningMessage(userData);
      await this.sendMessage(userData.telegramId, message);
    }

    if (users.length > 0) {
      this.logger.log(`Sent evening reminders (up to ${users.length} users)`);
    }
  }

  private async getUsersForTimeSlot(
    slot: 'morning' | 'evening',
  ): Promise<UserNotificationData[]> {
    const nowUtc = new Date();
    const currentHour = nowUtc.getUTCHours();
    const currentMinute = nowUtc.getUTCMinutes();

    const enabledField = slot === 'morning' ? 'morningEnabled' : 'eveningEnabled';
    const timeField = slot === 'morning' ? 'morningTime' : 'eveningTime';

    const prefs = await this.preferencesRepo.find({
      where: { [enabledField]: true },
      relations: ['user'],
    });

    const todayStr = nowUtc.toISOString().split('T')[0];
    const results: UserNotificationData[] = [];

    for (const pref of prefs) {
      const user = pref.user;
      if (!user) continue;

      const targetTime = pref[timeField];
      const [targetHour, targetMinute] = targetTime.split(':').map(Number);

      const offsetMinutes = this.getTimezoneOffsetMinutes(user.timezone);
      const targetUtcMinutes = targetHour * 60 + targetMinute - offsetMinutes;
      const normalizedTarget = ((targetUtcMinutes % 1440) + 1440) % 1440;
      const currentUtcMinutes = currentHour * 60 + currentMinute;

      const diff = Math.abs(currentUtcMinutes - normalizedTarget);
      if (diff > 7 && diff < 1433) continue;

      const habits = await this.habitsRepo.find({
        where: { userId: user.id, isActive: true },
      });

      if (habits.length === 0) continue;

      const completions = await this.completionsRepo.find({
        where: { userId: user.id, completedDate: todayStr },
      });

      const bestStreak = habits.reduce(
        (max, h) => Math.max(max, h.currentStreak),
        0,
      );

      results.push({
        telegramId: user.telegramId,
        languageCode: user.languageCode,
        timezone: user.timezone,
        totalHabits: habits.length,
        completedToday: completions.length,
        bestStreak,
      });
    }

    return results;
  }

  private buildMorningMessage(data: UserNotificationData): string {
    const isRu = data.languageCode === 'ru';

    if (isRu) {
      return `☀️ Доброе утро! У тебя ${data.totalHabits} привычек на сегодня. Начни день продуктивно!`;
    }
    return `☀️ Good morning! You have ${data.totalHabits} habits for today. Start your day strong!`;
  }

  private buildEveningMessage(data: UserNotificationData): string {
    const isRu = data.languageCode === 'ru';
    const remaining = data.totalHabits - data.completedToday;

    if (isRu) {
      const streakPart =
        data.bestStreak > 0
          ? ` Не потеряй стрик ${data.bestStreak} дн.!`
          : '';
      return `🌙 Осталось ${remaining} невыполненных привычек.${streakPart}`;
    }

    const streakPart =
      data.bestStreak > 0
        ? ` Don't lose your ${data.bestStreak}-day streak!`
        : '';
    return `🌙 You have ${remaining} incomplete habits left.${streakPart}`;
  }

  private async sendMessage(
    telegramId: number,
    text: string,
  ): Promise<void> {
    try {
      await this.bot.telegram.sendMessage(telegramId, text);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(
        `Failed to send message to ${telegramId}: ${message}`,
      );
    }
  }

  private getTimezoneOffsetMinutes(timezone: string): number {
    try {
      const now = new Date();
      const utcStr = now.toLocaleString('en-US', { timeZone: 'UTC' });
      const tzStr = now.toLocaleString('en-US', { timeZone: timezone });
      const utcDate = new Date(utcStr);
      const tzDate = new Date(tzStr);
      return (tzDate.getTime() - utcDate.getTime()) / 60000;
    } catch {
      return 0;
    }
  }
}
