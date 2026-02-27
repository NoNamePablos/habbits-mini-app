import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChallengesService } from './challenges.service';
import { ChallengesController } from './challenges.controller';
import { Challenge } from './entities/challenge.entity';
import { ChallengeDay } from './entities/challenge-day.entity';
import { ChallengeParticipant } from './entities/challenge-participant.entity';
import { User } from '../users/entities/user.entity';
import { GamificationModule } from '../gamification/gamification.module';
import { AchievementsModule } from '../achievements/achievements.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Challenge, ChallengeDay, ChallengeParticipant, User]),
    GamificationModule,
    AchievementsModule,
    UsersModule,
  ],
  controllers: [ChallengesController],
  providers: [ChallengesService],
  exports: [ChallengesService],
})
export class ChallengesModule {}
