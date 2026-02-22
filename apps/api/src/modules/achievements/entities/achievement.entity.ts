import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export type AchievementCategory = 'streak' | 'completion' | 'social' | 'time';

export interface AchievementCriteria {
  type:
    | 'streak'
    | 'total_completions'
    | 'habit_count'
    | 'perfect_day'
    | 'morning_streak';
  value: number;
}

@Entity('achievements')
export class Achievement extends BaseEntity {
  @Column({ type: 'varchar', length: 100, unique: true })
  key: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  icon: string;

  @Column({ type: 'enum', enum: ['streak', 'completion', 'social', 'time'] })
  category: AchievementCategory;

  @Column({ type: 'json' })
  criteria: AchievementCriteria;

  @Column({ default: 0 })
  xpReward: number;

  @Column({ default: false })
  isHidden: boolean;
}
