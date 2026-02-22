import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatsService } from './stats.service';
import { StatsController } from './stats.controller';
import { HabitCompletion } from '../habits/entities/habit-completion.entity';
import { Habit } from '../habits/entities/habit.entity';

@Module({
  imports: [TypeOrmModule.forFeature([HabitCompletion, Habit])],
  controllers: [StatsController],
  providers: [StatsService],
})
export class StatsModule {}
