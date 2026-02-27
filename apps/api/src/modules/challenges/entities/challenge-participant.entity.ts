import { Entity, Column, Index, Unique, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Challenge, ChallengeStatus } from './challenge.entity';
import { User } from '../../users/entities/user.entity';

@Entity('challenge_participants')
@Unique(['challengeId', 'userId'])
export class ChallengeParticipant extends BaseEntity {
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

  @Column({
    type: 'enum',
    enum: ChallengeStatus,
    default: ChallengeStatus.ACTIVE,
  })
  status: ChallengeStatus;

  @Column({ default: 0 })
  completedDays: number;

  @Column({ default: 0 })
  missedDays: number;

  @Column({ default: 0 })
  currentStreak: number;

  @Column({ default: 0 })
  bestStreak: number;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  abandonReason: string | null;
}
