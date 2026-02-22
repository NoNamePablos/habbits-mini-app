import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';

export enum HabitFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  CUSTOM = 'custom',
}

export enum HabitType {
  BOOLEAN = 'boolean',
  NUMERIC = 'numeric',
  DURATION = 'duration',
}

export enum TimeOfDay {
  MORNING = 'morning',
  AFTERNOON = 'afternoon',
  EVENING = 'evening',
  ANYTIME = 'anytime',
}

@Entity('habits')
export class Habit extends BaseEntity {
  @Column()
  @Index()
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 50, nullable: true })
  icon: string;

  @Column({ length: 7, nullable: true })
  color: string;

  @Column({ type: 'enum', enum: HabitFrequency, default: HabitFrequency.DAILY })
  frequency: HabitFrequency;

  @Column({ type: 'json', nullable: true })
  targetDays: number[];

  @Column({ type: 'enum', enum: HabitType, default: HabitType.BOOLEAN })
  type: HabitType;

  @Column({ type: 'float', nullable: true })
  targetValue: number;

  @Column({ default: 0 })
  currentStreak: number;

  @Column({ default: 0 })
  bestStreak: number;

  @Column({ default: 0 })
  sortOrder: number;

  @Column({ type: 'enum', enum: TimeOfDay, default: TimeOfDay.ANYTIME })
  timeOfDay: TimeOfDay;

  @Column({ default: true })
  isActive: boolean;
}
