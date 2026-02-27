import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Telegraf, Context } from 'telegraf';
import { NotificationPreference } from './notification-preference.entity';
import { User } from '../users/entities/user.entity';
import { Habit } from '../habits/entities/habit.entity';
import { HabitCompletion } from '../habits/entities/habit-completion.entity';
import { HabitsService } from '../habits/habits.service';

interface UserNotificationData {
  telegramId: number;
  languageCode: string | null;
  timezone: string;
  totalHabits: number;
  completedToday: number;
  bestStreak: number;
}

@Injectable()
export class NotificationsService implements OnModuleInit, OnModuleDestroy {
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
    private readonly habitsService: HabitsService,
  ) {
    const token = this.configService.getOrThrow<string>('TELEGRAM_BOT_TOKEN');
    this.bot = new Telegraf(token);
  }

  onModuleInit(): void {
    this.setupBotHandlers();
    this.bot.launch().catch((err: unknown) => {
      this.logger.error('Bot polling failed', err);
    });
    this.logger.log('Bot started (long polling)');
  }

  onModuleDestroy(): void {
    this.bot.stop('shutdown');
  }

  // ─── Bot command: /today ──────────────────────────────────────────────────

  private setupBotHandlers(): void {
    this.bot.command('today', (ctx) => this.handleTodayCommand(ctx));
    this.bot.action(/^h:(\d+)$/, (ctx) => this.handleCompleteCallback(ctx));
  }

  private async handleTodayCommand(ctx: Context): Promise<void> {
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    const user = await this.usersRepo.findOne({ where: { telegramId } });
    if (!user) {
      await ctx.reply(
        user === null ? '❌ Аккаунт не найден. Открой приложение для регистрации.' : '',
      );
      return;
    }

    const { text, keyboard } = await this.buildTodayPayload(user);
    await ctx.reply(text, { reply_markup: { inline_keyboard: keyboard }, parse_mode: 'HTML' });
  }

  private async handleCompleteCallback(ctx: Context): Promise<void> {
    const telegramId = ctx.from?.id;
    if (!telegramId || !('match' in ctx) || !ctx.match) return;

    const habitId = parseInt((ctx.match as RegExpMatchArray)[1], 10);
    const user = await this.usersRepo.findOne({ where: { telegramId } });
    if (!user) {
      await ctx.answerCbQuery('❌ Аккаунт не найден');
      return;
    }

    const isRu = user.languageCode === 'ru';

    try {
      const result = await this.habitsService.complete(habitId, user.id, {}, user.timezone ?? 'UTC');
      const streakMsg = result.habit.currentStreak > 1
        ? ` 🔥${result.habit.currentStreak}`
        : '';
      const xpMsg = `+${result.xpEarned + result.streakBonusXp} XP`;
      await ctx.answerCbQuery(`✅ ${result.habit.name}${streakMsg} ${xpMsg}`);

      const { text, keyboard } = await this.buildTodayPayload(user);
      await ctx.editMessageText(text, {
        reply_markup: { inline_keyboard: keyboard },
        parse_mode: 'HTML',
      });
    } catch {
      await ctx.answerCbQuery(isRu ? '✅ Уже выполнено!' : '✅ Already done!');
    }
  }

  private async buildTodayPayload(
    user: User,
  ): Promise<{ text: string; keyboard: { text: string; callback_data: string }[][] }> {
    const isRu = user.languageCode === 'ru';
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: user.timezone ?? 'UTC' }).format(new Date());

    const habits = await this.habitsRepo.find({
      where: { userId: user.id, isActive: true },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });

    const completions = await this.completionsRepo.find({
      where: { userId: user.id, completedDate: today },
    });
    const completedIds = new Set(completions.map((c) => c.habitId));

    const completedCount = completedIds.size;
    const total = habits.length;

    const header = isRu
      ? `📋 <b>Привычки на сегодня</b> (${completedCount}/${total})`
      : `📋 <b>Today's habits</b> (${completedCount}/${total})`;

    const lines = habits.map((h) => {
      const done = completedIds.has(h.id);
      const streak = h.currentStreak > 0 ? ` 🔥${h.currentStreak}` : '';
      return done ? `✅ ${h.name}${streak}` : `⬜ ${h.name}${streak}`;
    });

    const text = [header, '', ...lines].join('\n');

    // Inline keyboard: 2 buttons per row, only incomplete habits
    const incomplete = habits.filter((h) => !completedIds.has(h.id));
    const keyboard: { text: string; callback_data: string }[][] = [];
    for (let i = 0; i < incomplete.length; i += 2) {
      const row = incomplete.slice(i, i + 2).map((h) => ({
        text: `☑️ ${h.name}`,
        callback_data: `h:${h.id}`,
      }));
      keyboard.push(row);
    }

    if (incomplete.length === 0) {
      const done = isRu ? '\n\n🎉 <b>Все выполнено! Отличный день!</b>' : '\n\n🎉 <b>All done! Great job!</b>';
      return { text: text + done, keyboard: [] };
    }

    return { text, keyboard };
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
    data: Partial<Pick<NotificationPreference, 'morningEnabled' | 'eveningEnabled' | 'morningTime' | 'eveningTime' | 'dndEnabled' | 'dndStart' | 'dndEnd'>>,
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
    const botUsername = this.configService.get<string>('TELEGRAM_BOT_USERNAME', 'mybot');

    for (const userData of users) {
      const message = this.buildMorningMessage(userData);
      const keyboard = [[{
        text: userData.languageCode === 'ru' ? '📋 Открыть привычки' : '📋 Open habits',
        url: `https://t.me/${botUsername}`,
      }]];
      await this.sendMessageWithKeyboard(userData.telegramId, message, keyboard);
    }

    if (users.length > 0) {
      this.logger.log(`Sent ${users.length} morning reminders`);
    }
  }

  async sendEveningReminders(): Promise<void> {
    const users = await this.getUsersForTimeSlot('evening');
    const botUsername = this.configService.get<string>('TELEGRAM_BOT_USERNAME', 'mybot');

    for (const userData of users) {
      if (userData.completedToday >= userData.totalHabits) continue;

      const message = this.buildEveningMessage(userData);
      const keyboard = [[{
        text: userData.languageCode === 'ru' ? '📋 Открыть привычки' : '📋 Open habits',
        url: `https://t.me/${botUsername}`,
      }]];
      await this.sendMessageWithKeyboard(userData.telegramId, message, keyboard);
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

      if (pref.dndEnabled) {
        const offsetMinutes = this.getTimezoneOffsetMinutes(user.timezone);
        const localNowMinutes = ((currentHour * 60 + currentMinute + offsetMinutes) % 1440 + 1440) % 1440;
        const [dndStartH, dndStartM] = pref.dndStart.split(':').map(Number);
        const [dndEndH, dndEndM] = pref.dndEnd.split(':').map(Number);
        const dndStartMin = dndStartH * 60 + dndStartM;
        const dndEndMin = dndEndH * 60 + dndEndM;
        const inDnd = dndStartMin <= dndEndMin
          ? localNowMinutes >= dndStartMin && localNowMinutes < dndEndMin
          : localNowMinutes >= dndStartMin || localNowMinutes < dndEndMin;
        if (inDnd) continue;
      }

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

  async sendTestNotification(userId: number): Promise<void> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) return;
    const isRu = user.languageCode === 'ru';
    const message = isRu
      ? '🔔 Тестовое уведомление — всё работает!'
      : '🔔 Test notification — everything works!';
    await this.sendMessage(user.telegramId, message);
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

  private async sendMessageWithKeyboard(
    telegramId: number,
    text: string,
    inlineKeyboard: { text: string; url?: string; callback_data?: string }[][],
  ): Promise<void> {
    try {
      await this.bot.telegram.sendMessage(telegramId, text, {
        reply_markup: { inline_keyboard: inlineKeyboard },
      });
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
