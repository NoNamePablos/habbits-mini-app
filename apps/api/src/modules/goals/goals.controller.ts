import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import {
  GoalsService,
  GoalWithProgress,
  GoalCompletionResult,
} from './goals.service';
import { Goal } from './entities/goal.entity';
import { CreateGoalDto } from './dto/create-goal.dto';
import { TelegramAuthGuard } from '../../core/telegram/telegram-auth.guard';
import { TelegramUser } from '../../core/telegram/telegram-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('goals')
@UseGuards(TelegramAuthGuard)
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Get('active')
  async getActiveGoal(
    @TelegramUser() user: User,
  ): Promise<GoalWithProgress | null> {
    return this.goalsService.getActiveGoal(user.id);
  }

  @Get('history')
  async getHistory(@TelegramUser() user: User): Promise<Goal[]> {
    return this.goalsService.getHistory(user.id);
  }

  @Post()
  async create(
    @TelegramUser() user: User,
    @Body() dto: CreateGoalDto,
  ): Promise<Goal> {
    return this.goalsService.create(user.id, dto);
  }

  @Post(':id/abandon')
  async abandon(
    @TelegramUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Goal> {
    return this.goalsService.abandon(id, user.id);
  }
}
