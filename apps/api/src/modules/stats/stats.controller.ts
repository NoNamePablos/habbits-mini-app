import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  StatsSummary,
  HeatmapDay,
  HabitStats,
  WeeklySummaryData,
  StatsService,
} from './stats.service';
import { TelegramAuthGuard } from '../../core/telegram/telegram-auth.guard';
import { TelegramUser } from '../../core/telegram/telegram-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('stats')
@UseGuards(TelegramAuthGuard)
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('summary')
  async getSummary(@TelegramUser() user: User): Promise<StatsSummary> {
    return this.statsService.getSummary(user.id);
  }

  @Get('weekly-summary')
  async getWeeklySummary(
    @TelegramUser() user: User,
  ): Promise<WeeklySummaryData> {
    return this.statsService.getWeeklySummary(user.id);
  }

  @Get('heatmap')
  async getHeatmap(
    @TelegramUser() user: User,
    @Query('months') months?: string,
  ): Promise<HeatmapDay[]> {
    const parsed = months ? parseInt(months, 10) : 3;
    return this.statsService.getHeatmap(
      user.id,
      Number.isNaN(parsed) ? 3 : parsed,
    );
  }

  @Get('habits/:id')
  async getHabitStats(
    @TelegramUser() user: User,
    @Param('id', ParseIntPipe) habitId: number,
  ): Promise<HabitStats> {
    return this.statsService.getHabitStats(habitId, user.id);
  }
}
