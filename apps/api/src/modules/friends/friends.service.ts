import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Or } from 'typeorm';
import { Friendship, FriendshipStatus } from './entities/friendship.entity';
import { User } from '../users/entities/user.entity';

export interface FriendProfile {
  friendshipId: number;
  userId: number;
  username: string | null;
  firstName: string | null;
  photoUrl: string | null;
  level: number;
  xp: number;
}

export interface FriendRequestProfile {
  id: number;
  requesterId: number;
  requesterUsername: string | null;
  requesterFirstName: string | null;
  requesterPhotoUrl: string | null;
  createdAt: Date;
}

@Injectable()
export class FriendsService {
  constructor(
    @InjectRepository(Friendship)
    private readonly friendshipsRepo: Repository<Friendship>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  async getOrCreateInviteCode(userId: number): Promise<string> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (user.friendInviteCode) return user.friendInviteCode;

    const code = this.generateCode(12);
    user.friendInviteCode = code;
    await this.usersRepo.save(user);
    return code;
  }

  async requestByCode(requesterId: number, code: string): Promise<void> {
    const addressee = await this.usersRepo.findOne({
      where: { friendInviteCode: code },
    });
    if (!addressee) throw new NotFoundException('Invite code not found');
    if (addressee.id === requesterId) {
      throw new BadRequestException('Cannot send friend request to yourself');
    }

    const existing = await this.friendshipsRepo.findOne({
      where: [
        { requesterId, addresseeId: addressee.id },
        { requesterId: addressee.id, addresseeId: requesterId },
      ],
    });
    if (existing) {
      if (existing.status === FriendshipStatus.ACCEPTED) {
        throw new BadRequestException('Already friends');
      }
      if (existing.status === FriendshipStatus.PENDING) {
        throw new BadRequestException('Friend request already sent');
      }
      // declined — allow re-request by removing old entry
      await this.friendshipsRepo.remove(existing);
    }

    const friendship = this.friendshipsRepo.create({
      requesterId,
      addresseeId: addressee.id,
      status: FriendshipStatus.PENDING,
    });
    await this.friendshipsRepo.save(friendship);
  }

  async getFriends(userId: number): Promise<FriendProfile[]> {
    const friendships = await this.friendshipsRepo.find({
      where: [
        { requesterId: userId, status: FriendshipStatus.ACCEPTED },
        { addresseeId: userId, status: FriendshipStatus.ACCEPTED },
      ],
      relations: ['requester', 'addressee'],
    });

    return friendships.map((f) => {
      const friend = f.requesterId === userId ? f.addressee : f.requester;
      return {
        friendshipId: f.id,
        userId: friend.id,
        username: friend.username ?? null,
        firstName: friend.firstName ?? null,
        photoUrl: friend.photoUrl ?? null,
        level: friend.level,
        xp: friend.xp,
      };
    });
  }

  async getRequests(userId: number): Promise<FriendRequestProfile[]> {
    const friendships = await this.friendshipsRepo.find({
      where: { addresseeId: userId, status: FriendshipStatus.PENDING },
      relations: ['requester'],
      order: { createdAt: 'DESC' },
    });

    return friendships.map((f) => ({
      id: f.id,
      requesterId: f.requesterId,
      requesterUsername: f.requester.username ?? null,
      requesterFirstName: f.requester.firstName ?? null,
      requesterPhotoUrl: f.requester.photoUrl ?? null,
      createdAt: f.createdAt,
    }));
  }

  async acceptRequest(id: number, userId: number): Promise<void> {
    const friendship = await this.friendshipsRepo.findOne({ where: { id } });
    if (!friendship) throw new NotFoundException('Friend request not found');
    if (friendship.addresseeId !== userId) throw new ForbiddenException();
    if (friendship.status !== FriendshipStatus.PENDING) {
      throw new BadRequestException('Request is not pending');
    }
    friendship.status = FriendshipStatus.ACCEPTED;
    await this.friendshipsRepo.save(friendship);
  }

  async declineRequest(id: number, userId: number): Promise<void> {
    const friendship = await this.friendshipsRepo.findOne({ where: { id } });
    if (!friendship) throw new NotFoundException('Friend request not found');
    if (friendship.addresseeId !== userId) throw new ForbiddenException();
    if (friendship.status !== FriendshipStatus.PENDING) {
      throw new BadRequestException('Request is not pending');
    }
    friendship.status = FriendshipStatus.DECLINED;
    await this.friendshipsRepo.save(friendship);
  }

  async removeFriend(id: number, userId: number): Promise<void> {
    const friendship = await this.friendshipsRepo.findOne({ where: { id } });
    if (!friendship) throw new NotFoundException('Friendship not found');
    if (
      friendship.requesterId !== userId &&
      friendship.addresseeId !== userId
    ) {
      throw new ForbiddenException();
    }
    await this.friendshipsRepo.remove(friendship);
  }

  async getPendingCount(userId: number): Promise<number> {
    return this.friendshipsRepo.count({
      where: { addresseeId: userId, status: FriendshipStatus.PENDING },
    });
  }

  private generateCode(length: number): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const crypto = require('crypto');
    let code = '';
    for (let i = 0; i < length; i++) {
      code += chars[crypto.randomInt(0, chars.length)];
    }
    return code;
  }
}
