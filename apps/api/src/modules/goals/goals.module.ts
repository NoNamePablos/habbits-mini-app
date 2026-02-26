import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GoalsService } from './goals.service';
import { GoalsController } from './goals.controller';
import { Goal } from './entities/goal.entity';
import { Habit } from '../habits/entities/habit.entity';
import { HabitCompletion } from '../habits/entities/habit-completion.entity';
import { XpTransaction } from '../gamification/entities/xp-transaction.entity';
import { User } from '../users/entities/user.entity';
import { GamificationModule } from '../gamification/gamification.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Goal,
      Habit,
      HabitCompletion,
      XpTransaction,
      User,
    ]),
    GamificationModule,
    UsersModule,
  ],
  controllers: [GoalsController],
  providers: [GoalsService],
  exports: [GoalsService],
})
export class GoalsModule {}
