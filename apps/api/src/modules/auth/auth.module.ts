import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { GamificationModule } from '../gamification/gamification.module';
import { User } from '../users/entities/user.entity';
import { XpTransaction } from '../gamification/entities/xp-transaction.entity';

@Module({
  imports: [
    UsersModule,
    GamificationModule,
    TypeOrmModule.forFeature([User, XpTransaction]),
  ],
  controllers: [AuthController],
})
export class AuthModule {}
