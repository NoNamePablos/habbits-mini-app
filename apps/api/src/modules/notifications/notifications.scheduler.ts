import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { NotificationsService } from './notifications.service';

@Injectable()
export class NotificationsScheduler {
  private readonly logger = new Logger(NotificationsScheduler.name);

  constructor(
    private readonly notificationsService: NotificationsService,
  ) {}

  @Cron('0 0 */4 * * *')
  async handleReminders(): Promise<void> {
    try {
      await Promise.all([
        this.notificationsService.sendMorningReminders(),
        this.notificationsService.sendEveningReminders(),
      ]);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Reminder cron failed: ${message}`);
    }
  }
}
