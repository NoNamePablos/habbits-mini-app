import { IsEnum, IsInt, Min, Max } from 'class-validator';
import { GoalType } from '../entities/goal.entity';

export class CreateGoalDto {
  @IsEnum(GoalType)
  type: GoalType;

  @IsInt()
  @Min(1)
  @Max(10000)
  targetValue: number;

  @IsInt()
  @Min(1)
  @Max(365)
  durationDays: number;
}
