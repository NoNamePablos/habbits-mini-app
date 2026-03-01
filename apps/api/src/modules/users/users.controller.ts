import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { TelegramAuthGuard } from '../../core/telegram/telegram-auth.guard';
import { TelegramUser } from '../../core/telegram/telegram-user.decorator';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserSettingsDto } from './dto/update-user-settings.dto';
import { User } from './entities/user.entity';

@Controller('users')
@UseGuards(TelegramAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe(@TelegramUser() user: User): User {
    return user;
  }

  @Patch('me')
  async updateMe(
    @TelegramUser() user: User,
    @Body() dto: UpdateUserDto,
  ): Promise<User> {
    return this.usersService.update(user.id, dto);
  }

  @Patch('me/settings')
  async updateSettings(
    @TelegramUser() user: User,
    @Body() dto: UpdateUserSettingsDto,
  ): Promise<User> {
    return this.usersService.updateSettings(user.id, dto);
  }

  @Delete('me')
  async deleteMe(@TelegramUser() user: User): Promise<{ success: boolean }> {
    await this.usersService.deleteAccount(user.id);
    return { success: true };
  }
}
