import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { Challenge, ChallengeStatus } from './entities/challenge.entity';
import {
  ChallengeDay,
  ChallengeDayStatus,
} from './entities/challenge-day.entity';
import { User } from '../users/entities/user.entity';
import { CreateChallengeDto } from './dto/create-challenge.dto';
import { UpdateChallengeDto } from './dto/update-challenge.dto';
import { CheckInChallengeDto } from './dto/check-in-challenge.dto';
import { GamificationService } from '../gamification/gamification.service';
import { AchievementsService } from '../achievements/achievements.service';
import { Achievement } from '../achievements/entities/achievement.entity';

const XP_PER_CHECKIN = 15;
const COMPLETION_XP: Record<number, number> = {
  7: 50,
  14: 100,
  21: 150,
  30: 250,
  60: 500,
  90: 750,
};

interface UnlockedAchievementInfo {
  achievement: Achievement;
  xpAwarded: number;
}

interface CheckInResult {
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

interface ChallengeDetailResult {
  challenge: Challenge;
  days: ChallengeDay[];
  todayCheckedIn: boolean;
}

@Injectable()
export class ChallengesService {
  constructor(
    @InjectRepository(Challenge)
    private readonly challengesRepo: Repository<Challenge>,
    @InjectRepository(ChallengeDay)
    private readonly daysRepo: Repository<ChallengeDay>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly gamificationService: GamificationService,
    private readonly achievementsService: AchievementsService,
  ) {}

  async findAllByUser(
    userId: number,
    timezone: string = 'UTC',
  ): Promise<Array<Challenge & { todayCheckedIn: boolean }>> {
    const challenges = await this.challengesRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    const today = this.getTodayDate(timezone);
    const activeChallengeIds = challenges
      .filter((c) => c.status === ChallengeStatus.ACTIVE)
      .map((c) => c.id);

    // Single query for all today's check-ins
    let todayCheckIns = new Set<number>();
    if (activeChallengeIds.length > 0) {
      const rows = await this.daysRepo.find({
        where: {
          challengeId: In(activeChallengeIds),
          dayDate: today,
          status: ChallengeDayStatus.COMPLETED,
        },
        select: ['challengeId'],
      });
      todayCheckIns = new Set(rows.map((r) => r.challengeId));
    }

    // Sync missed days for active challenges
    for (const c of challenges) {
      if (c.status === ChallengeStatus.ACTIVE) {
        await this.syncMissedDays(c, timezone);
      }
    }

    // Sort: active first, then by createdAt DESC
    const sorted = challenges.sort((a, b) => {
      const aActive = a.status === ChallengeStatus.ACTIVE ? 0 : 1;
      const bActive = b.status === ChallengeStatus.ACTIVE ? 0 : 1;
      if (aActive !== bActive) return aActive - bActive;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return sorted.map((c) => ({
      ...c,
      todayCheckedIn: todayCheckIns.has(c.id),
    }));
  }

  async findOneWithDays(
    id: number,
    userId: number,
    timezone: string = 'UTC',
  ): Promise<ChallengeDetailResult> {
    const challenge = await this.challengesRepo.findOne({
      where: { id, userId },
    });
    if (!challenge) {
      throw new NotFoundException('Challenge not found');
    }

    // Sync missed days for active challenges
    if (challenge.status === ChallengeStatus.ACTIVE) {
      await this.syncMissedDays(challenge, timezone);
    }

    const days = await this.daysRepo.find({
      where: { challengeId: id },
      order: { dayDate: 'ASC' },
    });

    const today = this.getTodayDate(timezone);
    const todayCheckedIn = days.some(
      (d) =>
        d.dayDate === today && d.status === ChallengeDayStatus.COMPLETED,
    );

    return { challenge, days, todayCheckedIn };
  }

  async create(userId: number, dto: CreateChallengeDto): Promise<Challenge> {
    const endDate = this.addDays(dto.startDate, dto.durationDays - 1);

    const challenge = this.challengesRepo.create({
      ...dto,
      userId,
      endDate,
    });
    const saved = await this.challengesRepo.save(challenge);

    await this.achievementsService.checkAfterChallengeCreated(userId);

    return saved;
  }

  async update(
    id: number,
    userId: number,
    dto: UpdateChallengeDto,
  ): Promise<Challenge> {
    const challenge = await this.findOneOrFail(id, userId);

    if (challenge.status !== ChallengeStatus.ACTIVE) {
      throw new BadRequestException('Can only edit active challenges');
    }

    Object.assign(challenge, dto);
    return this.challengesRepo.save(challenge);
  }

  async remove(id: number, userId: number): Promise<void> {
    const challenge = await this.findOneOrFail(id, userId);
    await this.challengesRepo.remove(challenge);
  }

  async checkIn(
    id: number,
    userId: number,
    dto: CheckInChallengeDto,
    timezone: string = 'UTC',
  ): Promise<CheckInResult> {
    const challenge = await this.findOneOrFail(id, userId);
    const today = this.getTodayDate(timezone);

    if (challenge.status !== ChallengeStatus.ACTIVE) {
      throw new BadRequestException('Challenge is not active');
    }

    if (today < challenge.startDate || today > challenge.endDate) {
      throw new BadRequestException('Today is outside the challenge period');
    }

    // Check for duplicate
    const existing = await this.daysRepo.findOne({
      where: { challengeId: id, dayDate: today },
    });
    if (
      existing &&
      existing.status === ChallengeDayStatus.COMPLETED
    ) {
      throw new ConflictException('Already checked in today');
    }

    // Sync missed days first (may fail the challenge)
    await this.syncMissedDays(challenge, timezone);

    if (challenge.status !== ChallengeStatus.ACTIVE) {
      throw new BadRequestException(
        'Challenge failed due to too many missed days',
      );
    }

    // If there was a "missed" record for today (from sync), remove it
    if (existing && existing.status === ChallengeDayStatus.MISSED) {
      await this.daysRepo.remove(existing);
      challenge.missedDays = Math.max(0, challenge.missedDays - 1);
    }

    // Create check-in
    const xpEarned = XP_PER_CHECKIN;
    const day = this.daysRepo.create({
      challengeId: id,
      userId,
      dayDate: today,
      status: ChallengeDayStatus.COMPLETED,
      note: dto.note ?? null,
      xpEarned,
    });

    challenge.completedDays += 1;

    // Recalculate streak
    const streak = await this.recalculateStreak(id, day);
    challenge.currentStreak = streak;
    if (streak > challenge.bestStreak) {
      challenge.bestStreak = streak;
    }

    const streakBonusXp = this.getStreakBonus(challenge.currentStreak);

    // Check if challenge is now complete
    const totalAccountedDays = challenge.completedDays + challenge.missedDays;
    let challengeCompleted = false;
    let completionBonusXp = 0;

    if (totalAccountedDays >= challenge.durationDays) {
      challenge.status = ChallengeStatus.COMPLETED;
      challenge.completedAt = new Date();
      challengeCompleted = true;
      completionBonusXp = this.getCompletionBonus(challenge.durationDays);
    }

    // Save in transaction
    await this.dataSource.transaction(async (manager) => {
      await manager.save(day);
      await manager.save(challenge);
    });

    // Award XP
    const totalXp = xpEarned + streakBonusXp + completionBonusXp;
    const xpResult = await this.gamificationService.awardXp(
      userId,
      totalXp,
      'challenge',
      id,
    );

    // Check achievements
    let unlockedAchievements: UnlockedAchievementInfo[] = [];
    if (challengeCompleted) {
      unlockedAchievements =
        await this.achievementsService.checkAfterChallengeCompletion({
          userId,
          challengeId: id,
          durationDays: challenge.durationDays,
          missedDays: challenge.missedDays,
        });
    }

    return {
      day,
      challenge,
      xpEarned,
      streakBonusXp,
      completionBonusXp,
      leveledUp: xpResult.leveledUp,
      newLevel: xpResult.newLevel,
      challengeCompleted,
      unlockedAchievements,
    };
  }

  async undoCheckIn(
    id: number,
    userId: number,
    date: string,
  ): Promise<Challenge> {
    const challenge = await this.findOneOrFail(id, userId);

    const day = await this.daysRepo.findOne({
      where: {
        challengeId: id,
        dayDate: date,
        status: ChallengeDayStatus.COMPLETED,
      },
    });
    if (!day) {
      throw new NotFoundException('Check-in not found');
    }

    await this.daysRepo.remove(day);

    challenge.completedDays = Math.max(0, challenge.completedDays - 1);
    const streak = await this.recalculateStreak(id);
    challenge.currentStreak = streak;

    return this.challengesRepo.save(challenge);
  }

  async abandon(id: number, userId: number, reason?: string): Promise<Challenge> {
    const challenge = await this.findOneOrFail(id, userId);

    if (challenge.status !== ChallengeStatus.ACTIVE) {
      throw new BadRequestException('Challenge is not active');
    }

    challenge.status = ChallengeStatus.ABANDONED;
    challenge.abandonReason = reason ?? null;
    return this.challengesRepo.save(challenge);
  }

  private async findOneOrFail(
    id: number,
    userId: number,
  ): Promise<Challenge> {
    const challenge = await this.challengesRepo.findOne({
      where: { id, userId },
    });
    if (!challenge) {
      throw new NotFoundException('Challenge not found');
    }
    return challenge;
  }

  private async syncMissedDays(
    challenge: Challenge,
    timezone: string,
  ): Promise<void> {
    if (challenge.status !== ChallengeStatus.ACTIVE) return;

    const today = this.getTodayDate(timezone);
    const existingDays = await this.daysRepo.find({
      where: { challengeId: challenge.id },
      order: { dayDate: 'DESC' },
    });

    const existingDates = new Set(existingDays.map((d) => d.dayDate));

    // Find the range to check: from startDate to yesterday
    const yesterday = this.addDays(today, -1);
    if (yesterday < challenge.startDate) return;

    const endCheck =
      yesterday > challenge.endDate ? challenge.endDate : yesterday;

    let current = challenge.startDate;
    let newMisses = 0;

    while (current <= endCheck) {
      if (!existingDates.has(current)) {
        const missedDay = this.daysRepo.create({
          challengeId: challenge.id,
          userId: challenge.userId,
          dayDate: current,
          status: ChallengeDayStatus.MISSED,
          xpEarned: 0,
        });
        await this.daysRepo.save(missedDay);
        newMisses++;
      }
      current = this.addDays(current, 1);
    }

    if (newMisses > 0) {
      challenge.missedDays += newMisses;

      if (challenge.missedDays > challenge.allowedMisses) {
        challenge.status = ChallengeStatus.FAILED;
      }

      await this.challengesRepo.save(challenge);
    }
  }

  private async recalculateStreak(
    challengeId: number,
    pendingDay?: ChallengeDay,
  ): Promise<number> {
    const completedDays = await this.daysRepo.find({
      where: {
        challengeId,
        status: ChallengeDayStatus.COMPLETED,
      },
      order: { dayDate: 'DESC' },
      take: 365,
    });

    // Include pending day not yet saved
    const allDates = completedDays.map((d) => d.dayDate);
    if (pendingDay && !allDates.includes(pendingDay.dayDate)) {
      allDates.push(pendingDay.dayDate);
    }
    allDates.sort((a, b) => (a > b ? -1 : 1)); // DESC

    if (allDates.length === 0) return 0;

    let streak = 1;
    for (let i = 1; i < allDates.length; i++) {
      const expected = this.addDays(allDates[i - 1], -1);
      if (allDates[i] === expected) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  private getStreakBonus(streak: number): number {
    if (streak >= 30) return 200;
    if (streak >= 14) return 100;
    if (streak >= 7) return 50;
    return 0;
  }

  private getCompletionBonus(durationDays: number): number {
    if (COMPLETION_XP[durationDays]) {
      return COMPLETION_XP[durationDays];
    }
    return Math.round(durationDays * 8);
  }

  private getTodayDate(timezone: string = 'UTC'): string {
    return new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(
      new Date(),
    );
  }

  private addDays(dateStr: string, days: number): string {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  }
}
