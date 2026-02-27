import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationPreference } from './notification-preference.entity';
import { NotificationsService } from './notifications.service';
import { NotificationsScheduler } from './notifications.scheduler';
import { NotificationPreferencesController } from './notification-preferences.controller';
import { User } from '../users/entities/user.entity';
import { Habit } from '../habits/entities/habit.entity';
import { HabitCompletion } from '../habits/entities/habit-completion.entity';
import { UsersModule } from '../users/users.module';
import { HabitsModule } from '../habits/habits.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      NotificationPreference,
      User,
      Habit,
      HabitCompletion,
    ]),
    UsersModule,
    HabitsModule,
  ],
  controllers: [NotificationPreferencesController],
  providers: [NotificationsService, NotificationsScheduler],
  exports: [NotificationsService],
})
export class NotificationsModule {}
