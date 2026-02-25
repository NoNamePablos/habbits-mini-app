import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

export interface TelegramUserData {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async findOrCreateFromTelegram(tgUser: TelegramUserData): Promise<User> {
    let user = await this.usersRepository.findOne({
      where: { telegramId: tgUser.id },
    });

    if (user) {
      user.firstName = tgUser.first_name ?? user.firstName;
      user.lastName = tgUser.last_name ?? user.lastName;
      user.username = tgUser.username ?? user.username;
      user.photoUrl = tgUser.photo_url ?? user.photoUrl;
      user.languageCode = tgUser.language_code ?? user.languageCode;
      return this.usersRepository.save(user);
    }

    try {
      user = this.usersRepository.create({
        telegramId: tgUser.id,
        firstName: tgUser.first_name,
        lastName: tgUser.last_name,
        username: tgUser.username,
        photoUrl: tgUser.photo_url,
        languageCode: tgUser.language_code,
      });

      return await this.usersRepository.save(user);
    } catch (error: unknown) {
      const dbError = error as { code?: string };
      if (dbError.code === 'ER_DUP_ENTRY') {
        const existing = await this.usersRepository.findOne({
          where: { telegramId: tgUser.id },
        });
        if (existing) return existing;
      }
      throw error;
    }
  }

  async findByTelegramId(telegramId: number): Promise<User | null> {
    return this.usersRepository.findOne({ where: { telegramId } });
  }

  async update(id: number, data: Partial<User>): Promise<User> {
    await this.usersRepository.update(id, data);
    return this.usersRepository.findOneByOrFail({ id });
  }

  async deleteAccount(userId: number): Promise<void> {
    await this.usersRepository.delete(userId);
  }
}
