import {
  Entity,
  Column,
  Index,
  Unique,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Challenge } from './challenge.entity';
import { User } from '../../users/entities/user.entity';

export enum ChallengeDayStatus {
  COMPLETED = 'completed',
  MISSED = 'missed',
}

@Entity('challenge_days')
@Unique(['challengeId', 'userId', 'dayDate'])
export class ChallengeDay extends BaseEntity {
  @Column()
  @Index()
  challengeId: number;

  @ManyToOne(() => Challenge, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'challengeId' })
  challenge: Challenge;

  @Column()
  @Index()
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'date' })
  dayDate: string;

  @Column({
    type: 'enum',
    enum: ChallengeDayStatus,
    default: ChallengeDayStatus.COMPLETED,
  })
  status: ChallengeDayStatus;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @Column({ default: 0 })
  xpEarned: number;
}
