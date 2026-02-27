import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { Challenge, ChallengeStatus } from './entities/challenge.entity';
import {
  ChallengeDay,
  ChallengeDayStatus,
} from './entities/challenge-day.entity';
import { ChallengeParticipant } from './entities/challenge-participant.entity';
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

export interface ChallengeDetailResult {
  challenge: Challenge;
  days: ChallengeDay[];
  todayCheckedIn: boolean;
  isCreator: boolean;
  participant: ChallengeParticipant | null;
}

export interface LeaderboardEntry {
  userId: number;
  username: string | null;
  firstName: string | null;
  photoUrl: string | null;
  level: number;
  completedDays: number;
  currentStreak: number;
  bestStreak: number;
  status: ChallengeStatus;
  isCreator: boolean;
}

@Injectable()
export class ChallengesService {
  constructor(
    @InjectRepository(Challenge)
    private readonly challengesRepo: Repository<Challenge>,
    @InjectRepository(ChallengeDay)
    private readonly daysRepo: Repository<ChallengeDay>,
    @InjectRepository(ChallengeParticipant)
    private readonly participantsRepo: Repository<ChallengeParticipant>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly gamificationService: GamificationService,
    private readonly achievementsService: AchievementsService,
  ) {}

  async findAllByUser(
    userId: number,
    timezone: string = 'UTC',
  ): Promise<Array<Challenge & { todayCheckedIn: boolean; isCreator: boolean; participantStatus: ChallengeStatus | null }>> {
    const createdChallenges = await this.challengesRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    const participantRecords = await this.participantsRepo.find({
      where: { userId },
      relations: ['challenge'],
      order: { createdAt: 'DESC' },
    });

    const today = this.getTodayDate(timezone);

    // Sync missed days for creator's active challenges
    for (const c of createdChallenges) {
      if (c.status === ChallengeStatus.ACTIVE) {
        await this.syncMissedDays(c, timezone);
      }
    }

    // Collect all challenge IDs to check today's check-ins
    const activeChallengeIds = createdChallenges
      .filter((c) => c.status === ChallengeStatus.ACTIVE)
      .map((c) => c.id);
    const activeParticipantChallengeIds = participantRecords
      .filter((p) => p.status === ChallengeStatus.ACTIVE)
      .map((p) => p.challengeId);
    const allActiveIds = [...activeChallengeIds, ...activeParticipantChallengeIds];

    let todayCheckIns = new Set<string>(); // "challengeId:userId"
    if (allActiveIds.length > 0) {
      const rows = await this.daysRepo.find({
        where: {
          challengeId: In(allActiveIds),
          userId,
          dayDate: today,
          status: ChallengeDayStatus.COMPLETED,
        },
        select: ['challengeId'],
      });
      for (const r of rows) {
        todayCheckIns.add(`${r.challengeId}:${userId}`);
      }
    }

    const createdResults = createdChallenges.map((c) => ({
      ...c,
      todayCheckedIn: todayCheckIns.has(`${c.id}:${userId}`),
      isCreator: true,
      participantStatus: null as ChallengeStatus | null,
    }));

    const createdIds = new Set(createdChallenges.map((c) => c.id));
    const participantResults = participantRecords
      .filter((p) => !createdIds.has(p.challengeId))
      .map((p) => ({
        ...p.challenge,
        todayCheckedIn: todayCheckIns.has(`${p.challengeId}:${userId}`),
        isCreator: false,
        participantStatus: p.status,
      }));

    const all = [...createdResults, ...participantResults];
    return all.sort((a, b) => {
      const aActive = a.status === ChallengeStatus.ACTIVE ? 0 : 1;
      const bActive = b.status === ChallengeStatus.ACTIVE ? 0 : 1;
      if (aActive !== bActive) return aActive - bActive;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  async findOneWithDays(
    id: number,
    userId: number,
    timezone: string = 'UTC',
  ): Promise<ChallengeDetailResult> {
    let challenge = await this.challengesRepo.findOne({ where: { id, userId } });
    let isCreator = true;
    let participant: ChallengeParticipant | null = null;

    if (!challenge) {
      participant = await this.participantsRepo.findOne({
        where: { challengeId: id, userId },
        relations: ['challenge'],
      });
      if (!participant) {
        throw new NotFoundException('Challenge not found');
      }
      challenge = participant.challenge;
      isCreator = false;
    }

    if (isCreator && challenge.status === ChallengeStatus.ACTIVE) {
      await this.syncMissedDays(challenge, timezone);
    }

    const days = await this.daysRepo.find({
      where: { challengeId: id, userId },
      order: { dayDate: 'ASC' },
    });

    const today = this.getTodayDate(timezone);
    const todayCheckedIn = days.some(
      (d) => d.dayDate === today && d.status === ChallengeDayStatus.COMPLETED,
    );

    return { challenge, days, todayCheckedIn, isCreator, participant };
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
    const challenge = await this.challengesRepo.findOne({ where: { id } });
    if (!challenge) throw new NotFoundException('Challenge not found');

    const isCreator = challenge.userId === userId;

    if (!isCreator) {
      const participant = await this.participantsRepo.findOne({
        where: { challengeId: id, userId },
      });
      if (!participant) {
        throw new ForbiddenException('Not a participant of this challenge');
      }
      if (participant.status !== ChallengeStatus.ACTIVE) {
        throw new BadRequestException('Your participation is not active');
      }
      return this.participantCheckIn(challenge, participant, userId, dto, timezone);
    }

    return this.creatorCheckIn(challenge, userId, dto, timezone);
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
        userId,
        dayDate: date,
        status: ChallengeDayStatus.COMPLETED,
      },
    });
    if (!day) {
      throw new NotFoundException('Check-in not found');
    }

    await this.daysRepo.remove(day);

    challenge.completedDays = Math.max(0, challenge.completedDays - 1);
    const streak = await this.recalculateStreak(id, userId);
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

  // ── Social features ──────────────────────────────────────────────────────────

  async generateInviteCode(id: number, userId: number): Promise<{ inviteCode: string }> {
    const challenge = await this.findOneOrFail(id, userId);

    if (challenge.status !== ChallengeStatus.ACTIVE) {
      throw new BadRequestException('Can only invite to active challenges');
    }

    if (challenge.inviteCode) {
      return { inviteCode: challenge.inviteCode };
    }

    const code = this.generateCode(8);
    challenge.inviteCode = code;
    await this.challengesRepo.save(challenge);
    return { inviteCode: code };
  }

  async revokeInviteCode(id: number, userId: number): Promise<void> {
    const challenge = await this.findOneOrFail(id, userId);
    challenge.inviteCode = null;
    await this.challengesRepo.save(challenge);
  }

  async joinByCode(
    code: string,
    userId: number,
    timezone: string = 'UTC',
  ): Promise<ChallengeDetailResult> {
    const challenge = await this.challengesRepo.findOne({
      where: { inviteCode: code },
    });
    if (!challenge) throw new NotFoundException('Invite code not found');

    if (challenge.status !== ChallengeStatus.ACTIVE) {
      throw new BadRequestException('Challenge is no longer active');
    }

    if (challenge.userId === userId) {
      throw new BadRequestException('You are the creator of this challenge');
    }

    const existing = await this.participantsRepo.findOne({
      where: { challengeId: challenge.id, userId },
    });
    if (existing) {
      throw new ConflictException('Already joined this challenge');
    }

    const participant = this.participantsRepo.create({
      challengeId: challenge.id,
      userId,
      status: ChallengeStatus.ACTIVE,
    });
    await this.participantsRepo.save(participant);

    return this.findOneWithDays(challenge.id, userId, timezone);
  }

  async getLeaderboard(id: number, userId: number): Promise<LeaderboardEntry[]> {
    const challenge = await this.challengesRepo.findOne({ where: { id } });
    if (!challenge) throw new NotFoundException('Challenge not found');

    // Verify caller is creator or participant
    const isCreator = challenge.userId === userId;
    if (!isCreator) {
      const participant = await this.participantsRepo.findOne({
        where: { challengeId: id, userId },
      });
      if (!participant) throw new ForbiddenException();
    }

    const participants = await this.participantsRepo.find({
      where: { challengeId: id },
      relations: ['user'],
    });

    const creator = await this.usersRepo.findOne({ where: { id: challenge.userId } });

    const entries: LeaderboardEntry[] = [];

    if (creator) {
      entries.push({
        userId: creator.id,
        username: creator.username ?? null,
        firstName: creator.firstName ?? null,
        photoUrl: creator.photoUrl ?? null,
        level: creator.level,
        completedDays: challenge.completedDays,
        currentStreak: challenge.currentStreak,
        bestStreak: challenge.bestStreak,
        status: challenge.status,
        isCreator: true,
      });
    }

    for (const p of participants) {
      entries.push({
        userId: p.user.id,
        username: p.user.username ?? null,
        firstName: p.user.firstName ?? null,
        photoUrl: p.user.photoUrl ?? null,
        level: p.user.level,
        completedDays: p.completedDays,
        currentStreak: p.currentStreak,
        bestStreak: p.bestStreak,
        status: p.status,
        isCreator: false,
      });
    }

    return entries.sort((a, b) => b.completedDays - a.completedDays);
  }

  async leaveChallenge(id: number, userId: number): Promise<void> {
    const participant = await this.participantsRepo.findOne({
      where: { challengeId: id, userId },
    });
    if (!participant) throw new NotFoundException('Participation not found');
    await this.participantsRepo.remove(participant);
  }

  // ── Private helpers ──────────────────────────────────────────────────────────

  private async creatorCheckIn(
    challenge: Challenge,
    userId: number,
    dto: CheckInChallengeDto,
    timezone: string,
  ): Promise<CheckInResult> {
    const today = this.getTodayDate(timezone);

    if (challenge.status !== ChallengeStatus.ACTIVE) {
      throw new BadRequestException('Challenge is not active');
    }

    if (today < challenge.startDate || today > challenge.endDate) {
      throw new BadRequestException('Today is outside the challenge period');
    }

    const existing = await this.daysRepo.findOne({
      where: { challengeId: challenge.id, userId, dayDate: today },
    });
    if (existing && existing.status === ChallengeDayStatus.COMPLETED) {
      throw new ConflictException('Already checked in today');
    }

    await this.syncMissedDays(challenge, timezone);

    if (challenge.status !== ChallengeStatus.ACTIVE) {
      throw new BadRequestException('Challenge failed due to too many missed days');
    }

    if (existing && existing.status === ChallengeDayStatus.MISSED) {
      await this.daysRepo.remove(existing);
      challenge.missedDays = Math.max(0, challenge.missedDays - 1);
    }

    const xpEarned = XP_PER_CHECKIN;
    const day = this.daysRepo.create({
      challengeId: challenge.id,
      userId,
      dayDate: today,
      status: ChallengeDayStatus.COMPLETED,
      note: dto.note ?? null,
      xpEarned,
    });

    challenge.completedDays += 1;

    const streak = await this.recalculateStreak(challenge.id, userId, day);
    challenge.currentStreak = streak;
    if (streak > challenge.bestStreak) challenge.bestStreak = streak;

    const streakBonusXp = this.getStreakBonus(challenge.currentStreak);

    const totalAccountedDays = challenge.completedDays + challenge.missedDays;
    let challengeCompleted = false;
    let completionBonusXp = 0;

    if (totalAccountedDays >= challenge.durationDays) {
      challenge.status = ChallengeStatus.COMPLETED;
      challenge.completedAt = new Date();
      challengeCompleted = true;
      completionBonusXp = this.getCompletionBonus(challenge.durationDays);
    }

    await this.dataSource.transaction(async (manager) => {
      await manager.save(day);
      await manager.save(challenge);
    });

    const totalXp = xpEarned + streakBonusXp + completionBonusXp;
    const xpResult = await this.gamificationService.awardXp(userId, totalXp, 'challenge', challenge.id);

    let unlockedAchievements: UnlockedAchievementInfo[] = [];
    if (challengeCompleted) {
      unlockedAchievements = await this.achievementsService.checkAfterChallengeCompletion({
        userId,
        challengeId: challenge.id,
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

  private async participantCheckIn(
    challenge: Challenge,
    participant: ChallengeParticipant,
    userId: number,
    dto: CheckInChallengeDto,
    timezone: string,
  ): Promise<CheckInResult> {
    const today = this.getTodayDate(timezone);

    if (challenge.status !== ChallengeStatus.ACTIVE) {
      throw new BadRequestException('Challenge is not active');
    }

    if (today < challenge.startDate || today > challenge.endDate) {
      throw new BadRequestException('Today is outside the challenge period');
    }

    const existing = await this.daysRepo.findOne({
      where: { challengeId: challenge.id, userId, dayDate: today },
    });
    if (existing && existing.status === ChallengeDayStatus.COMPLETED) {
      throw new ConflictException('Already checked in today');
    }

    const xpEarned = XP_PER_CHECKIN;
    const day = this.daysRepo.create({
      challengeId: challenge.id,
      userId,
      dayDate: today,
      status: ChallengeDayStatus.COMPLETED,
      note: dto.note ?? null,
      xpEarned,
    });

    participant.completedDays += 1;

    const streak = await this.recalculateStreak(challenge.id, userId, day);
    participant.currentStreak = streak;
    if (streak > participant.bestStreak) participant.bestStreak = streak;

    const streakBonusXp = this.getStreakBonus(participant.currentStreak);

    await this.dataSource.transaction(async (manager) => {
      await manager.save(day);
      await manager.save(participant);
    });

    const xpResult = await this.gamificationService.awardXp(userId, xpEarned + streakBonusXp, 'challenge', challenge.id);

    return {
      day,
      challenge,
      xpEarned,
      streakBonusXp,
      completionBonusXp: 0,
      leveledUp: xpResult.leveledUp,
      newLevel: xpResult.newLevel,
      challengeCompleted: false,
      unlockedAchievements: [],
    };
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
      where: { challengeId: challenge.id, userId: challenge.userId },
      order: { dayDate: 'DESC' },
    });

    const existingDates = new Set(existingDays.map((d) => d.dayDate));

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
    userId: number,
    pendingDay?: ChallengeDay,
  ): Promise<number> {
    const completedDays = await this.daysRepo.find({
      where: {
        challengeId,
        userId,
        status: ChallengeDayStatus.COMPLETED,
      },
      order: { dayDate: 'DESC' },
      take: 365,
    });

    const allDates = completedDays.map((d) => d.dayDate);
    if (pendingDay && !allDates.includes(pendingDay.dayDate)) {
      allDates.push(pendingDay.dayDate);
    }
    allDates.sort((a, b) => (a > b ? -1 : 1));

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

  private generateCode(length: number): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const crypto = require('crypto');
    let code = '';
    for (let i = 0; i < length; i++) {
      code += chars[crypto.randomInt(0, chars.length)];
    }
    return code;
  }
}
