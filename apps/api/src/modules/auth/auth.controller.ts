import { Controller, Post, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { TelegramAuthGuard } from '../../core/telegram/telegram-auth.guard';
import { TelegramUser } from '../../core/telegram/telegram-user.decorator';
import { User } from '../users/entities/user.entity';
import { GamificationService } from '../gamification/gamification.service';
import { XpTransaction } from '../gamification/entities/xp-transaction.entity';

const DAILY_LOGIN_XP = 5;

interface AuthResponse {
  user: User;
  message: string;
  dailyLoginXp: number | null;
  weekLoginDays: string[];
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly gamificationService: GamificationService,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(XpTransaction)
    private readonly xpTransRepo: Repository<XpTransaction>,
  ) {}

  @Post('telegram')
  @UseGuards(TelegramAuthGuard)
  async authenticate(@TelegramUser() user: User): Promise<AuthResponse> {
    const today = new Date().toISOString().split('T')[0];
    let dailyLoginXp: number | null = null;

    if (user.lastLoginDate !== today) {
      await this.gamificationService.awardXp(
        user.id,
        DAILY_LOGIN_XP,
        'daily_login',
      );
      user.lastLoginDate = today;
      await this.usersRepo.save(user);
      dailyLoginXp = DAILY_LOGIN_XP;
    }

    const weekLoginDays = await this.getWeekLoginDays(user.id);

    return {
      user,
      message: 'Authenticated successfully',
      dailyLoginXp,
      weekLoginDays,
    };
  }

  private async getWeekLoginDays(userId: number): Promise<string[]> {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0);

    const transactions = await this.xpTransRepo.find({
      where: {
        userId,
        source: 'daily_login',
        createdAt: MoreThanOrEqual(monday),
      },
      order: { createdAt: 'ASC' },
    });

    const days = new Set<string>();
    for (const tx of transactions) {
      days.add(tx.createdAt.toISOString().split('T')[0]);
    }

    return Array.from(days);
  }
}
