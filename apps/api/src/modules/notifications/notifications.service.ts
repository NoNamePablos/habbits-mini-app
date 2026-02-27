import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Telegraf, Context, Markup } from 'telegraf';
import { NotificationPreference } from './notification-preference.entity';
import { User } from '../users/entities/user.entity';
import { Habit } from '../habits/entities/habit.entity';
import { HabitCompletion } from '../habits/entities/habit-completion.entity';
import { HabitsService } from '../habits/habits.service';
import { ChallengesService } from '../challenges/challenges.service';
import { ChallengeStatus } from '../challenges/entities/challenge.entity';

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
    private readonly challengesService: ChallengesService,
  ) {
    const token = this.configService.getOrThrow<string>('TELEGRAM_BOT_TOKEN');
    this.bot = new Telegraf(token);
  }

  onModuleInit(): void {
    this.setupBotHandlers();
    this.bot.telegram
      .setMyCommands([
        { command: 'today', description: 'Привычки и челленджи на сегодня' },
        { command: 'streak', description: 'Текущие стрики' },
        { command: 'stats', description: 'Статистика за неделю' },
        { command: 'help', description: 'Список команд' },
      ])
      .catch(() => undefined);

    const webAppUrl = this.configService.get<string>('TELEGRAM_WEBAPP_URL');
    if (webAppUrl) {
      this.bot.telegram
        .setChatMenuButton({
          menuButton: {
            type: 'web_app',
            text: '📱 Открыть',
            web_app: { url: webAppUrl },
          },
        })
        .catch(() => undefined);
    }

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
    this.bot.command('start', (ctx) => this.handleStartCommand(ctx));
    this.bot.command('today', (ctx) => this.handleTodayCommand(ctx));
    this.bot.command('streak', (ctx) => this.handleStreakCommand(ctx));
    this.bot.command('stats', (ctx) => this.handleStatsCommand(ctx));
    this.bot.command('help', (ctx) => this.handleHelpCommand(ctx));
    // Reply keyboard button handlers (match by leading emoji, language-agnostic)
    this.bot.hears(/^📋/, (ctx) => this.handleTodayCommand(ctx));
    this.bot.hears(/^🔥/, (ctx) => this.handleStreakCommand(ctx));
    this.bot.hears(/^📊/, (ctx) => this.handleStatsCommand(ctx));
    this.bot.action(/^h:(\d+)$/, (ctx) => this.handleCompleteCallback(ctx));
    this.bot.action(/^c:(\d+)$/, (ctx) =>
      this.handleChallengeCheckInCallback(ctx),
    );
  }

  // ─── Bot command: /start ─────────────────────────────────────────────────

  private async handleStartCommand(ctx: Context): Promise<void> {
    const isRu = ctx.from?.language_code === 'ru';
    const name = ctx.from?.first_name ?? (isRu ? 'друг' : 'there');
    const webAppUrl = this.configService.get<string>('TELEGRAM_WEBAPP_URL');

    const welcome = isRu
      ? `👋 Привет, ${name}!\n\nЯ помогу тебе следить за привычками и челленджами прямо здесь — без открытия приложения.\n\nИспользуй кнопки ниже 👇`
      : `👋 Hey, ${name}!\n\nI'll help you track habits and challenges right here — no need to open the app.\n\nUse the buttons below 👇`;

    await ctx.reply(welcome, {
      ...this.buildReplyKeyboard(isRu, webAppUrl),
      parse_mode: 'HTML',
    });
  }

  private buildReplyKeyboard(isRu: boolean, webAppUrl?: string) {
    type KBtn =
      | { text: string }
      | { text: string; web_app: { url: string } };

    const rows: KBtn[][] = [
      [
        { text: isRu ? '📋 Сегодня' : '📋 Today' },
        { text: isRu ? '🔥 Стрики' : '🔥 Streaks' },
      ],
      [{ text: isRu ? '📊 Статистика' : '📊 Stats' }],
    ];

    if (webAppUrl) {
      rows.push([
        {
          text: isRu ? '📱 Открыть приложение' : '📱 Open app',
          web_app: { url: webAppUrl },
        },
      ]);
    }

    return Markup.keyboard(rows).resize().persistent();
  }

  private async handleTodayCommand(ctx: Context): Promise<void> {
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    const user = await this.usersRepo.findOne({ where: { telegramId } });
    if (!user) {
      await ctx.reply(
        user === null
          ? '❌ Аккаунт не найден. Открой приложение для регистрации.'
          : '',
      );
      return;
    }

    const { text, keyboard } = await this.buildTodayPayload(user);
    await ctx.reply(text, {
      reply_markup: { inline_keyboard: keyboard },
      parse_mode: 'HTML',
    });
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
      const result = await this.habitsService.complete(
        habitId,
        user.id,
        {},
        user.timezone ?? 'UTC',
      );
      const streakMsg =
        result.habit.currentStreak > 1
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

  private async handleChallengeCheckInCallback(ctx: Context): Promise<void> {
    const telegramId = ctx.from?.id;
    if (!telegramId || !('match' in ctx) || !ctx.match) return;

    const challengeId = parseInt((ctx.match as RegExpMatchArray)[1], 10);
    const user = await this.usersRepo.findOne({ where: { telegramId } });
    if (!user) {
      await ctx.answerCbQuery('❌ Аккаунт не найден');
      return;
    }

    const isRu = user.languageCode === 'ru';

    try {
      const result = await this.challengesService.checkIn(
        challengeId,
        user.id,
        {},
        user.timezone ?? 'UTC',
      );
      const streakMsg =
        result.challenge.currentStreak > 1
          ? ` 🔥${result.challenge.currentStreak}`
          : '';
      const xpMsg = `+${result.xpEarned + result.streakBonusXp} XP`;
      await ctx.answerCbQuery(
        `✅ ${result.challenge.title}${streakMsg} ${xpMsg}`,
      );

      const { text, keyboard } = await this.buildTodayPayload(user);
      await ctx.editMessageText(text, {
        reply_markup: { inline_keyboard: keyboard },
        parse_mode: 'HTML',
      });
    } catch {
      await ctx.answerCbQuery(isRu ? '✅ Уже выполнено!' : '✅ Already done!');
    }
  }

  // ─── Bot command: /streak ─────────────────────────────────────────────────

  private async handleStreakCommand(ctx: Context): Promise<void> {
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    const user = await this.usersRepo.findOne({ where: { telegramId } });
    if (!user) {
      await ctx.reply(
        '❌ Аккаунт не найден. Открой приложение для регистрации.',
      );
      return;
    }

    const isRu = user.languageCode === 'ru';

    const habits = await this.habitsRepo.find({
      where: { userId: user.id, isActive: true },
      order: { currentStreak: 'DESC' },
    });

    const withStreak = habits.filter((h) => h.currentStreak > 0);

    const allChallenges = await this.challengesService.findAllByUser(
      user.id,
      user.timezone ?? 'UTC',
    );
    const challengesWithStreak = allChallenges
      .filter((c) => c.status === ChallengeStatus.ACTIVE && c.currentStreak > 0)
      .sort((a, b) => b.currentStreak - a.currentStreak);

    if (withStreak.length === 0 && challengesWithStreak.length === 0) {
      await ctx.reply(
        isRu
          ? '📭 Пока нет активных стриков. Начни сегодня!'
          : '📭 No active streaks yet. Start today!',
        { parse_mode: 'HTML' },
      );
      return;
    }

    const lines: string[] = [
      isRu ? '🔥 <b>Текущие стрики</b>' : '🔥 <b>Current streaks</b>',
      '',
    ];

    if (withStreak.length > 0) {
      lines.push(isRu ? '<b>Привычки:</b>' : '<b>Habits:</b>');
      for (const h of withStreak) {
        lines.push(
          `  🔥 ${h.name} — ${h.currentStreak} ${isRu ? 'дн.' : 'd.'}`,
        );
      }
    }

    if (challengesWithStreak.length > 0) {
      if (withStreak.length > 0) lines.push('');
      lines.push(isRu ? '<b>Челленджи:</b>' : '<b>Challenges:</b>');
      for (const c of challengesWithStreak) {
        lines.push(
          `  🏆 ${c.title} — ${c.currentStreak} ${isRu ? 'дн.' : 'd.'}`,
        );
      }
    }

    await ctx.reply(lines.join('\n'), { parse_mode: 'HTML' });
  }

  // ─── Bot command: /stats ──────────────────────────────────────────────────

  private async handleStatsCommand(ctx: Context): Promise<void> {
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    const user = await this.usersRepo.findOne({ where: { telegramId } });
    if (!user) {
      await ctx.reply(
        '❌ Аккаунт не найден. Открой приложение для регистрации.',
      );
      return;
    }

    const isRu = user.languageCode === 'ru';
    const tz = user.timezone ?? 'UTC';
    const today = this.getTodayStr(tz);
    const monday = this.getMondayStr(tz);

    const habits = await this.habitsRepo.find({
      where: { userId: user.id, isActive: true },
    });

    const todayCompletions = await this.completionsRepo.find({
      where: { userId: user.id, completedDate: today },
    });

    const weekCompletions = await this.completionsRepo.find({
      where: { userId: user.id, completedDate: Between(monday, today) },
    });

    const bestStreak = habits.reduce(
      (max, h) => Math.max(max, h.currentStreak),
      0,
    );

    const allChallenges = await this.challengesService.findAllByUser(
      user.id,
      tz,
    );
    const activeChallengesCount = allChallenges.filter(
      (c) => c.status === ChallengeStatus.ACTIVE,
    ).length;

    const lines = [
      isRu ? '📊 <b>Статистика</b>' : '📊 <b>Stats</b>',
      '',
      isRu
        ? `📅 Сегодня: <b>${todayCompletions.length}/${habits.length}</b>`
        : `📅 Today: <b>${todayCompletions.length}/${habits.length}</b>`,
      isRu
        ? `📆 За неделю: <b>${weekCompletions.length}</b> отметок`
        : `📆 This week: <b>${weekCompletions.length}</b> check-ins`,
      isRu
        ? `🔥 Лучший стрик: <b>${bestStreak}</b> дн.`
        : `🔥 Best streak: <b>${bestStreak}</b> d.`,
    ];

    if (activeChallengesCount > 0) {
      lines.push(
        isRu
          ? `🏆 Активных челленджей: <b>${activeChallengesCount}</b>`
          : `🏆 Active challenges: <b>${activeChallengesCount}</b>`,
      );
    }

    await ctx.reply(lines.join('\n'), { parse_mode: 'HTML' });
  }

  // ─── Bot command: /help ───────────────────────────────────────────────────

  private async handleHelpCommand(ctx: Context): Promise<void> {
    const isRu = ctx.from?.language_code === 'ru';
    const text = isRu
      ? [
          '📖 <b>Команды</b>',
          '',
          '/today — привычки и челленджи на сегодня',
          '/streak — текущие стрики',
          '/stats — статистика за неделю',
          '/help — этот список',
        ].join('\n')
      : [
          '📖 <b>Commands</b>',
          '',
          "/today — today's habits and challenges",
          '/streak — current streaks',
          '/stats — weekly stats',
          '/help — this list',
        ].join('\n');

    await ctx.reply(text, { parse_mode: 'HTML' });
  }

  private getTodayStr(timezone: string): string {
    return new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(
      new Date(),
    );
  }

  private getMondayStr(timezone: string): string {
    const today = this.getTodayStr(timezone);
    const date = new Date(today + 'T00:00:00');
    const day = date.getDay();
    const offset = day === 0 ? -6 : 1 - day;
    date.setDate(date.getDate() + offset);
    return date.toISOString().split('T')[0];
  }

  private async buildTodayPayload(user: User): Promise<{
    text: string;
    keyboard: { text: string; callback_data: string }[][];
  }> {
    const isRu = user.languageCode === 'ru';
    const tz = user.timezone ?? 'UTC';
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(
      new Date(),
    );

    // ── Habits ────────────────────────────────────────────────────────────────
    const habits = await this.habitsRepo.find({
      where: { userId: user.id, isActive: true },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });

    const completions = await this.completionsRepo.find({
      where: { userId: user.id, completedDate: today },
    });
    const completedHabitIds = new Set(completions.map((c) => c.habitId));

    const habitHeader = isRu
      ? `📋 <b>Привычки</b> (${completedHabitIds.size}/${habits.length})`
      : `📋 <b>Habits</b> (${completedHabitIds.size}/${habits.length})`;

    const habitLines = habits.map((h) => {
      const done = completedHabitIds.has(h.id);
      const streak = h.currentStreak > 0 ? ` 🔥${h.currentStreak}` : '';
      return done ? `✅ ${h.name}${streak}` : `⬜ ${h.name}${streak}`;
    });

    // ── Challenges ────────────────────────────────────────────────────────────
    const allChallenges = await this.challengesService.findAllByUser(
      user.id,
      tz,
    );
    const activeChallenges = allChallenges.filter(
      (c) => c.status === ChallengeStatus.ACTIVE,
    );

    let challengeSection = '';
    if (activeChallenges.length > 0) {
      const challengeHeader = isRu
        ? '🏆 <b>Челленджи</b>'
        : '🏆 <b>Challenges</b>';
      const challengeLines = activeChallenges.map((c) => {
        const streak = c.currentStreak > 0 ? ` 🔥${c.currentStreak}` : '';
        return c.todayCheckedIn
          ? `✅ ${c.title}${streak}`
          : `⬜ ${c.title}${streak}`;
      });
      challengeSection =
        '\n\n' + [challengeHeader, ...challengeLines].join('\n');
    }

    // ── Assemble text ─────────────────────────────────────────────────────────
    const text = [habitHeader, '', ...habitLines].join('\n') + challengeSection;

    // ── Keyboard ──────────────────────────────────────────────────────────────
    const incompleteHabits = habits.filter((h) => !completedHabitIds.has(h.id));
    const incompleteChallenges = activeChallenges.filter(
      (c) => !c.todayCheckedIn,
    );

    if (
      incompleteHabits.length === 0 &&
      incompleteChallenges.length === 0 &&
      (habits.length > 0 || activeChallenges.length > 0)
    ) {
      const done = isRu
        ? '\n\n🎉 <b>Всё выполнено! Отличный день!</b>'
        : '\n\n🎉 <b>All done! Great job!</b>';
      return { text: text + done, keyboard: [] };
    }

    const keyboard: { text: string; callback_data: string }[][] = [];
    for (let i = 0; i < incompleteHabits.length; i += 2) {
      keyboard.push(
        incompleteHabits.slice(i, i + 2).map((h) => ({
          text: `☑️ ${h.name}`,
          callback_data: `h:${h.id}`,
        })),
      );
    }
    for (let i = 0; i < incompleteChallenges.length; i += 2) {
      keyboard.push(
        incompleteChallenges.slice(i, i + 2).map((c) => ({
          text: `🏆 ${c.title}`,
          callback_data: `c:${c.id}`,
        })),
      );
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
    data: Partial<
      Pick<
        NotificationPreference,
        | 'morningEnabled'
        | 'eveningEnabled'
        | 'morningTime'
        | 'eveningTime'
        | 'dndEnabled'
        | 'dndStart'
        | 'dndEnd'
      >
    >,
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
    const botUsername = this.configService.get<string>(
      'TELEGRAM_BOT_USERNAME',
      'mybot',
    );

    for (const userData of users) {
      const message = this.buildMorningMessage(userData);
      const keyboard = [
        [
          {
            text:
              userData.languageCode === 'ru'
                ? '📋 Открыть привычки'
                : '📋 Open habits',
            url: `https://t.me/${botUsername}`,
          },
        ],
      ];
      await this.sendMessageWithKeyboard(
        userData.telegramId,
        message,
        keyboard,
      );
    }

    if (users.length > 0) {
      this.logger.log(`Sent ${users.length} morning reminders`);
    }
  }

  async sendEveningReminders(): Promise<void> {
    const users = await this.getUsersForTimeSlot('evening');
    const botUsername = this.configService.get<string>(
      'TELEGRAM_BOT_USERNAME',
      'mybot',
    );

    for (const userData of users) {
      if (userData.completedToday >= userData.totalHabits) continue;

      const message = this.buildEveningMessage(userData);
      const keyboard = [
        [
          {
            text:
              userData.languageCode === 'ru'
                ? '📋 Открыть привычки'
                : '📋 Open habits',
            url: `https://t.me/${botUsername}`,
          },
        ],
      ];
      await this.sendMessageWithKeyboard(
        userData.telegramId,
        message,
        keyboard,
      );
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

    const enabledField =
      slot === 'morning' ? 'morningEnabled' : 'eveningEnabled';
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
        const localNowMinutes =
          (((currentHour * 60 + currentMinute + offsetMinutes) % 1440) + 1440) %
          1440;
        const [dndStartH, dndStartM] = pref.dndStart.split(':').map(Number);
        const [dndEndH, dndEndM] = pref.dndEnd.split(':').map(Number);
        const dndStartMin = dndStartH * 60 + dndStartM;
        const dndEndMin = dndEndH * 60 + dndEndM;
        const inDnd =
          dndStartMin <= dndEndMin
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
        data.bestStreak > 0 ? ` Не потеряй стрик ${data.bestStreak} дн.!` : '';
      return `🌙 Осталось ${remaining} невыполненных привычек.${streakPart}`;
    }

    const streakPart =
      data.bestStreak > 0
        ? ` Don't lose your ${data.bestStreak}-day streak!`
        : '';
    return `🌙 You have ${remaining} incomplete habits left.${streakPart}`;
  }

  private async sendMessage(telegramId: number, text: string): Promise<void> {
    try {
      await this.bot.telegram.sendMessage(telegramId, text);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Failed to send message to ${telegramId}: ${message}`);
    }
  }

  private async sendMessageWithKeyboard(
    telegramId: number,
    text: string,
    inlineKeyboard: (
      | { text: string; url: string }
      | { text: string; callback_data: string }
    )[][],
  ): Promise<void> {
    try {
      await this.bot.telegram.sendMessage(telegramId, text, {
        reply_markup: { inline_keyboard: inlineKeyboard },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Failed to send message to ${telegramId}: ${message}`);
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
