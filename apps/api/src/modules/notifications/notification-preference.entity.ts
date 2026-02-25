import { Entity, Column, Index, OneToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../users/entities/user.entity';

@Entity('notification_preferences')
export class NotificationPreference extends BaseEntity {
  @Column({ unique: true })
  @Index()
  userId: number;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ default: true })
  morningEnabled: boolean;

  @Column({ default: true })
  eveningEnabled: boolean;

  @Column({ length: 5, default: '09:00' })
  morningTime: string;

  @Column({ length: 5, default: '21:00' })
  eveningTime: string;
}
