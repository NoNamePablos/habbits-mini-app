import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { XpTransaction, XpSource } from './entities/xp-transaction.entity';
import { User } from '../users/entities/user.entity';

interface GamificationProfile {
  xp: number;
  level: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  progressPercent: number;
  streakFreezes: number;
}

interface XpResult {
  totalXpAwarded: number;
  newLevel: number;
  leveledUp: boolean;
  previousLevel: number;
}

@Injectable()
export class GamificationService {
  constructor(
    @InjectRepository(XpTransaction)
    private readonly xpTransRepo: Repository<XpTransaction>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  static xpRequiredForLevel(level: number): number {
    return Math.floor(100 * Math.pow(level, 1.5));
  }

  static calculateLevel(totalXp: number): number {
    let level = 1;
    let xpRemaining = totalXp;

    while (xpRemaining >= GamificationService.xpRequiredForLevel(level)) {
      xpRemaining -= GamificationService.xpRequiredForLevel(level);
      level++;
    }

    return level;
  }

  async getProfile(userId: number): Promise<GamificationProfile> {
    const user = await this.usersRepo.findOneByOrFail({ id: userId });

    const level = user.level;
    const xpForNextLevel = GamificationService.xpRequiredForLevel(level);

    let xpSpent = 0;
    for (let l = 1; l < level; l++) {
      xpSpent += GamificationService.xpRequiredForLevel(l);
    }

    const xpForCurrentLevel = user.xp - xpSpent;
    const progressPercent =
      xpForNextLevel > 0
        ? Math.round((xpForCurrentLevel / xpForNextLevel) * 100)
        : 0;

    return {
      xp: user.xp,
      level: user.level,
      xpForCurrentLevel,
      xpForNextLevel,
      progressPercent,
      streakFreezes: user.streakFreezes,
    };
  }

  async awardXp(
    userId: number,
    amount: number,
    source: XpSource,
    referenceId?: number,
  ): Promise<XpResult> {
    const user = await this.usersRepo.findOneByOrFail({ id: userId });
    const previousLevel = user.level;

    // Record transaction
    const transaction = this.xpTransRepo.create({
      userId,
      amount,
      source,
      referenceId: referenceId ?? null,
    });
    await this.xpTransRepo.save(transaction);

    // Update user XP and level
    user.xp += amount;
    user.level = GamificationService.calculateLevel(user.xp);
    await this.usersRepo.save(user);

    return {
      totalXpAwarded: amount,
      newLevel: user.level,
      leveledUp: user.level > previousLevel,
      previousLevel,
    };
  }
}
