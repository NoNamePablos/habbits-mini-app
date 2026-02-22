import { Controller, Post, UseGuards } from '@nestjs/common';
import { TelegramAuthGuard } from '../../core/telegram/telegram-auth.guard';
import { TelegramUser } from '../../core/telegram/telegram-user.decorator';
import { User } from '../users/entities/user.entity';

interface AuthResponse {
  user: User;
  message: string;
}

@Controller('auth')
export class AuthController {
  @Post('telegram')
  @UseGuards(TelegramAuthGuard)
  authenticate(@TelegramUser() user: User): AuthResponse {
    return {
      user,
      message: 'Authenticated successfully',
    };
  }
}
