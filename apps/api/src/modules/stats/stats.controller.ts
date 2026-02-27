import {
  Controller,
  Get,
  Header,
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
  DaySummary,
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
  @Header('Cache-Control', 'private, max-age=60')
  async getSummary(@TelegramUser() user: User): Promise<StatsSummary> {
    return this.statsService.getSummary(user.id, user.timezone);
  }

  @Get('weekly-summary')
  @Header('Cache-Control', 'private, max-age=60')
  async getWeeklySummary(
    @TelegramUser() user: User,
  ): Promise<WeeklySummaryData> {
    return this.statsService.getWeeklySummary(user.id, user.timezone);
  }

  @Get('week')
  @Header('Cache-Control', 'private, max-age=30')
  async getWeekDays(
    @TelegramUser() user: User,
    @Query('offset') offset?: string,
  ): Promise<DaySummary[]> {
    const parsed = offset ? parseInt(offset, 10) : 0;
    const safeOffset = Math.min(0, Number.isNaN(parsed) ? 0 : parsed);
    return this.statsService.getWeekDays(user.id, user.timezone, safeOffset);
  }

  @Get('heatmap')
  @Header('Cache-Control', 'private, max-age=300')
  async getHeatmap(
    @TelegramUser() user: User,
    @Query('months') months?: string,
  ): Promise<HeatmapDay[]> {
    const parsed = months ? parseInt(months, 10) : 3;
    return this.statsService.getHeatmap(
      user.id,
      Number.isNaN(parsed) ? 3 : parsed,
      user.timezone,
    );
  }

  @Get('habits/:id')
  async getHabitStats(
    @TelegramUser() user: User,
    @Param('id', ParseIntPipe) habitId: number,
  ): Promise<HabitStats> {
    return this.statsService.getHabitStats(habitId, user.id, user.timezone);
  }
}
