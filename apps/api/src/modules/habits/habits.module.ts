import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Habit } from './entities/habit.entity';
import { HabitCompletion } from './entities/habit-completion.entity';
import { User } from '../users/entities/user.entity';
import { HabitsService } from './habits.service';
import { HabitsController } from './habits.controller';
import { UsersModule } from '../users/users.module';
import { GamificationModule } from '../gamification/gamification.module';
import { AchievementsModule } from '../achievements/achievements.module';
import { GoalsModule } from '../goals/goals.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Habit, HabitCompletion, User]),
    UsersModule,
    GamificationModule,
    AchievementsModule,
    GoalsModule,
  ],
  controllers: [HabitsController],
  providers: [HabitsService],
  exports: [HabitsService],
})
export class HabitsModule {}
