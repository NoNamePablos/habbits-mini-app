import { Controller, Get, UseGuards } from '@nestjs/common';
import { AchievementsService } from './achievements.service';
import { TelegramAuthGuard } from '../../core/telegram/telegram-auth.guard';
import { TelegramUser } from '../../core/telegram/telegram-user.decorator';
import { User } from '../users/entities/user.entity';
import { Achievement } from './entities/achievement.entity';

interface AchievementWithStatus extends Achievement {
  unlocked: boolean;
  unlockedAt: Date | null;
}

@Controller('achievements')
@UseGuards(TelegramAuthGuard)
export class AchievementsController {
  constructor(private readonly achievementsService: AchievementsService) {}

  @Get()
  async findAll(@TelegramUser() user: User): Promise<AchievementWithStatus[]> {
    return this.achievementsService.getAllForUser(user.id);
  }
}
