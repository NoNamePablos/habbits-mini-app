import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  PrimaryGeneratedColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export type XpSource =
  | 'habit_complete'
  | 'streak_bonus'
  | 'achievement'
  | 'daily_login'
  | 'challenge';

@Entity('xp_transactions')
export class XpTransaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Index()
  userId: number;

  @Column()
  amount: number;

  @Column({
    type: 'enum',
    enum: [
      'habit_complete',
      'streak_bonus',
      'achievement',
      'daily_login',
      'challenge',
    ],
  })
  source: XpSource;

  @Column({ type: 'int', nullable: true })
  referenceId: number | null;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;
}
