import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export interface UserSettings {
  seenFlags?: string[];
  weekStartsMonday?: boolean;
  focusMode?: boolean;
  theme?: 'light' | 'dark' | 'auto';
}

@Entity('users')
export class User extends BaseEntity {
  @Column({ type: 'bigint', unique: true })
  @Index()
  telegramId: number;

  @Column({ nullable: true })
  username: string;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ nullable: true })
  photoUrl: string;

  @Column({ nullable: true, length: 10 })
  languageCode: string;

  @Column({ default: 0 })
  xp: number;

  @Column({ default: 1 })
  level: number;

  @Column({ default: 0 })
  streakFreezes: number;

  @Column({ type: 'date', nullable: true, default: null })
  lastFreezeUsedDate: string | null;

  @Column({ type: 'date', nullable: true, default: null })
  lastLoginDate: string | null;

  @Column({ default: 'UTC', length: 50 })
  timezone: string;

  @Column({
    type: 'varchar',
    length: 16,
    unique: true,
    nullable: true,
    default: null,
  })
  friendInviteCode: string | null;

  @Column({ type: 'json', nullable: true, default: null })
  settings: UserSettings | null;
}
