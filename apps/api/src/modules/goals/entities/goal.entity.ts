import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';

export enum GoalType {
  COMPLETION_RATE = 'completion_rate',
  STREAK_DAYS = 'streak_days',
  TOTAL_XP = 'total_xp',
  TOTAL_COMPLETIONS = 'total_completions',
}

export enum GoalStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('goals')
export class Goal extends BaseEntity {
  @Column()
  @Index()
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({
    type: 'enum',
    enum: GoalType,
  })
  type: GoalType;

  @Column({ type: 'int' })
  targetValue: number;

  @Column({ type: 'int' })
  durationDays: number;

  @Column({ type: 'date' })
  startDate: string;

  @Column({ type: 'date' })
  deadline: string;

  @Column({
    type: 'enum',
    enum: GoalStatus,
    default: GoalStatus.ACTIVE,
  })
  status: GoalStatus;

  @Column({ type: 'int', default: 0 })
  xpReward: number;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date | null;
}
