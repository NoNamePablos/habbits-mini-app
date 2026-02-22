import { Entity, Column, Index, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Habit } from './habit.entity';

@Entity('habit_completions')
@Unique(['habitId', 'completedDate'])
@Index(['userId', 'completedDate'])
export class HabitCompletion extends BaseEntity {
  @Column()
  @Index()
  habitId: number;

  @ManyToOne(() => Habit, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'habitId' })
  habit: Habit;

  @Column()
  @Index()
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'date' })
  @Index()
  completedDate: string;

  @Column({ type: 'float', nullable: true })
  value: number;

  @Column({ default: 0 })
  xpEarned: number;

  @Column({ type: 'text', nullable: true })
  note: string;
}
