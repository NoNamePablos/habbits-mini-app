import { Controller, Get, UseGuards } from '@nestjs/common';
import { GamificationService } from './gamification.service';
import { TelegramAuthGuard } from '../../core/telegram/telegram-auth.guard';
import { TelegramUser } from '../../core/telegram/telegram-user.decorator';
import { User } from '../users/entities/user.entity';

interface GamificationProfileResponse {
  xp: number;
  level: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  progressPercent: number;
}

@Controller('gamification')
@UseGuards(TelegramAuthGuard)
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  @Get('profile')
  async getProfile(
    @TelegramUser() user: User,
  ): Promise<GamificationProfileResponse> {
    return this.gamificationService.getProfile(user.id);
  }
}
