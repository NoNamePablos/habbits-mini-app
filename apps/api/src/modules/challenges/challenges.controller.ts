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
import { ChallengesService } from './challenges.service';
import { TelegramAuthGuard } from '../../core/telegram/telegram-auth.guard';
import { TelegramUser } from '../../core/telegram/telegram-user.decorator';
import { User } from '../users/entities/user.entity';
import { Challenge } from './entities/challenge.entity';
import { ChallengeDay } from './entities/challenge-day.entity';
import { CreateChallengeDto } from './dto/create-challenge.dto';
import { UpdateChallengeDto } from './dto/update-challenge.dto';
import { CheckInChallengeDto } from './dto/check-in-challenge.dto';
import { AbandonChallengeDto } from './dto/abandon-challenge.dto';
import { Achievement } from '../achievements/entities/achievement.entity';

interface ChallengesListResponse {
  challenges: Array<Challenge & { todayCheckedIn: boolean }>;
}

interface ChallengeDetailResponse {
  challenge: Challenge;
  days: ChallengeDay[];
  todayCheckedIn: boolean;
}

interface UnlockedAchievementInfo {
  achievement: Achievement;
  xpAwarded: number;
}

interface CheckInResponse {
  day: ChallengeDay;
  challenge: Challenge;
  xpEarned: number;
  streakBonusXp: number;
  completionBonusXp: number;
  leveledUp: boolean;
  newLevel: number;
  challengeCompleted: boolean;
  unlockedAchievements: UnlockedAchievementInfo[];
}

@Controller('challenges')
@UseGuards(TelegramAuthGuard)
export class ChallengesController {
  constructor(private readonly challengesService: ChallengesService) {}

  @Get()
  async findAll(
    @TelegramUser() user: User,
  ): Promise<ChallengesListResponse> {
    const challenges = await this.challengesService.findAllByUser(user.id, user.timezone);
    return { challenges };
  }

  @Post()
  async create(
    @TelegramUser() user: User,
    @Body() dto: CreateChallengeDto,
  ): Promise<Challenge> {
    return this.challengesService.create(user.id, dto);
  }

  @Get(':id')
  async findOne(
    @TelegramUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ChallengeDetailResponse> {
    return this.challengesService.findOneWithDays(id, user.id, user.timezone);
  }

  @Patch(':id')
  async update(
    @TelegramUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateChallengeDto,
  ): Promise<Challenge> {
    return this.challengesService.update(id, user.id, dto);
  }

  @Delete(':id')
  async remove(
    @TelegramUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    return this.challengesService.remove(id, user.id);
  }

  @Post(':id/check-in')
  async checkIn(
    @TelegramUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CheckInChallengeDto,
  ): Promise<CheckInResponse> {
    return this.challengesService.checkIn(id, user.id, dto, user.timezone);
  }

  @Delete(':id/check-in/:date')
  async undoCheckIn(
    @TelegramUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Param('date') date: string,
  ): Promise<Challenge> {
    return this.challengesService.undoCheckIn(id, user.id, date);
  }

  @Post(':id/abandon')
  async abandon(
    @TelegramUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AbandonChallengeDto,
  ): Promise<Challenge> {
    return this.challengesService.abandon(id, user.id, dto.reason);
  }
}
