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
import { ChallengesService, ChallengeDetailResult, LeaderboardEntry } from './challenges.service';
import { TelegramAuthGuard } from '../../core/telegram/telegram-auth.guard';
import { TelegramUser } from '../../core/telegram/telegram-user.decorator';
import { User } from '../users/entities/user.entity';
import { Challenge, ChallengeStatus } from './entities/challenge.entity';
import { ChallengeDay } from './entities/challenge-day.entity';
import { ChallengeParticipant } from './entities/challenge-participant.entity';
import { CreateChallengeDto } from './dto/create-challenge.dto';
import { UpdateChallengeDto } from './dto/update-challenge.dto';
import { CheckInChallengeDto } from './dto/check-in-challenge.dto';
import { AbandonChallengeDto } from './dto/abandon-challenge.dto';
interface ChallengesListResponse {
  challenges: Array<Challenge & { todayCheckedIn: boolean; isCreator: boolean; participantStatus: ChallengeStatus | null }>;
}

interface ChallengeDetailResponse {
  challenge: Challenge;
  days: ChallengeDay[];
  todayCheckedIn: boolean;
  isCreator: boolean;
  participant: ChallengeParticipant | null;
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

  @Post(':id/invite')
  async generateInviteCode(
    @TelegramUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ inviteCode: string }> {
    return this.challengesService.generateInviteCode(id, user.id);
  }

  @Delete(':id/invite')
  async revokeInviteCode(
    @TelegramUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    return this.challengesService.revokeInviteCode(id, user.id);
  }

  @Post('join/:code')
  async joinByCode(
    @TelegramUser() user: User,
    @Param('code') code: string,
  ): Promise<ChallengeDetailResult> {
    return this.challengesService.joinByCode(code, user.id, user.timezone);
  }

  @Get(':id/leaderboard')
  async getLeaderboard(
    @TelegramUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<LeaderboardEntry[]> {
    return this.challengesService.getLeaderboard(id, user.id);
  }

  @Delete(':id/participants/me')
  async leaveChallenge(
    @TelegramUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    return this.challengesService.leaveChallenge(id, user.id);
  }
}
