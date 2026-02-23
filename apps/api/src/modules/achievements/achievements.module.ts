import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AchievementsService } from './achievements.service';
import { AchievementsController } from './achievements.controller';
import { Achievement } from './entities/achievement.entity';
import { UserAchievement } from './entities/user-achievement.entity';
import { Habit } from '../habits/entities/habit.entity';
import { HabitCompletion } from '../habits/entities/habit-completion.entity';
import { GamificationModule } from '../gamification/gamification.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Achievement,
      UserAchievement,
      Habit,
      HabitCompletion,
    ]),
    GamificationModule,
    UsersModule,
  ],
  controllers: [AchievementsController],
  providers: [AchievementsService],
  exports: [AchievementsService],
})
export class AchievementsModule {}
