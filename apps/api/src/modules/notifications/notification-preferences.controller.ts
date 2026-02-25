import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { TelegramAuthGuard } from '../../core/telegram/telegram-auth.guard';
import { TelegramUser } from '../../core/telegram/telegram-user.decorator';
import { User } from '../users/entities/user.entity';
import { NotificationPreference } from './notification-preference.entity';
import { UpdateNotificationPreferencesDto } from './update-notification-preferences.dto';

@Controller('notifications')
@UseGuards(TelegramAuthGuard)
export class NotificationPreferencesController {
  constructor(
    private readonly notificationsService: NotificationsService,
  ) {}

  @Get('preferences')
  async getPreferences(
    @TelegramUser() user: User,
  ): Promise<NotificationPreference> {
    return this.notificationsService.getPreferences(user.id);
  }

  @Patch('preferences')
  async updatePreferences(
    @TelegramUser() user: User,
    @Body() dto: UpdateNotificationPreferencesDto,
  ): Promise<NotificationPreference> {
    return this.notificationsService.updatePreferences(user.id, dto);
  }
}
