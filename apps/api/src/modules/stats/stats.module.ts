import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatsService } from './stats.service';
import { StatsController } from './stats.controller';
import { HabitCompletion } from '../habits/entities/habit-completion.entity';
import { Habit } from '../habits/entities/habit.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([HabitCompletion, Habit]), UsersModule],
  controllers: [StatsController],
  providers: [StatsService],
})
export class StatsModule {}
