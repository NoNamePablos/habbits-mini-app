import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { HabitsService } from './habits.service';
import { TelegramAuthGuard } from '../../core/telegram/telegram-auth.guard';
import { TelegramUser } from '../../core/telegram/telegram-user.decorator';
import { User } from '../users/entities/user.entity';
import { Habit } from './entities/habit.entity';
import { HabitCompletion } from './entities/habit-completion.entity';
import { CreateHabitDto } from './dto/create-habit.dto';
import { BatchCreateHabitsDto } from './dto/batch-create-habits.dto';
import { UpdateHabitDto } from './dto/update-habit.dto';
import { CompleteHabitDto } from './dto/complete-habit.dto';
import { Achievement } from '../achievements/entities/achievement.entity';

interface HabitsListResponse {
  habits: Habit[];
  todayCompletions: HabitCompletion[];
}

interface UnlockedAchievementInfo {
  achievement: Achievement;
  xpAwarded: number;
}

interface CompleteResponse {
  completion: HabitCompletion;
  habit: Habit;
  xpEarned: number;
  streakBonusXp: number;
  leveledUp: boolean;
  newLevel: number;
  unlockedAchievements: UnlockedAchievementInfo[];
}

@Controller('habits')
@UseGuards(TelegramAuthGuard)
export class HabitsController {
  constructor(private readonly habitsService: HabitsService) {}

  @Get()
  async findAll(@TelegramUser() user: User): Promise<HabitsListResponse> {
    const [habits, todayCompletions] = await Promise.all([
      this.habitsService.findAllByUser(user.id),
      this.habitsService.getTodayCompletions(user.id, user.timezone),
    ]);
    return { habits, todayCompletions };
  }

  @Post()
  async create(
    @TelegramUser() user: User,
    @Body() dto: CreateHabitDto,
  ): Promise<Habit> {
    return this.habitsService.create(user.id, dto);
  }

  @Post('batch')
  async createBatch(
    @TelegramUser() user: User,
    @Body() dto: BatchCreateHabitsDto,
  ): Promise<Habit[]> {
    return this.habitsService.createBatch(user.id, dto.habits);
  }

  @Get(':id')
  async findOne(
    @TelegramUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Habit> {
    return this.habitsService.findOneOrFail(id, user.id);
  }

  @Patch(':id')
  async update(
    @TelegramUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateHabitDto,
  ): Promise<Habit> {
    return this.habitsService.update(id, user.id, dto);
  }

  @Delete(':id')
  async remove(
    @TelegramUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    return this.habitsService.remove(id, user.id);
  }

  @Post(':id/complete')
  async complete(
    @TelegramUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CompleteHabitDto,
  ): Promise<CompleteResponse> {
    return this.habitsService.complete(id, user.id, dto, user.timezone);
  }

  @Delete(':id/complete/:date')
  async uncomplete(
    @TelegramUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Param('date') date: string,
  ): Promise<Habit> {
    return this.habitsService.uncomplete(id, user.id, date);
  }
}
