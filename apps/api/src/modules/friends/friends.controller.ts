import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { FriendsService, FriendProfile, FriendRequestProfile } from './friends.service';
import { TelegramAuthGuard } from '../../core/telegram/telegram-auth.guard';
import { TelegramUser } from '../../core/telegram/telegram-user.decorator';
import { User } from '../users/entities/user.entity';

interface InviteCodeResponse {
  code: string;
  link: string;
}

@Controller('friends')
@UseGuards(TelegramAuthGuard)
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @Get()
  async getFriends(@TelegramUser() user: User): Promise<FriendProfile[]> {
    return this.friendsService.getFriends(user.id);
  }

  @Get('requests')
  async getRequests(@TelegramUser() user: User): Promise<FriendRequestProfile[]> {
    return this.friendsService.getRequests(user.id);
  }

  @Get('invite-code')
  async getInviteCode(@TelegramUser() user: User): Promise<InviteCodeResponse> {
    const code = await this.friendsService.getOrCreateInviteCode(user.id);
    const botUsername = process.env.TELEGRAM_BOT_USERNAME ?? 'mybot';
    return { code, link: `https://t.me/${botUsername}?start=fi_${code}` };
  }

  @Get('pending-count')
  async getPendingCount(@TelegramUser() user: User): Promise<{ count: number }> {
    const count = await this.friendsService.getPendingCount(user.id);
    return { count };
  }

  @Post('request/:code')
  async requestByCode(
    @TelegramUser() user: User,
    @Param('code') code: string,
  ): Promise<{ message: string }> {
    await this.friendsService.requestByCode(user.id, code);
    return { message: 'Friend request sent' };
  }

  @Patch(':id/accept')
  async acceptRequest(
    @TelegramUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ message: string }> {
    await this.friendsService.acceptRequest(id, user.id);
    return { message: 'Friend request accepted' };
  }

  @Patch(':id/decline')
  async declineRequest(
    @TelegramUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ message: string }> {
    await this.friendsService.declineRequest(id, user.id);
    return { message: 'Friend request declined' };
  }

  @Delete(':id')
  async removeFriend(
    @TelegramUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ message: string }> {
    await this.friendsService.removeFriend(id, user.id);
    return { message: 'Friend removed' };
  }
}
