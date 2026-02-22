import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsNumber,
  MaxLength,
} from 'class-validator';
import { HabitFrequency, HabitType, TimeOfDay } from '../entities/habit.entity';

export class CreateHabitDto {
  @IsString()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  icon?: string;

  @IsOptional()
  @IsString()
  @MaxLength(7)
  color?: string;

  @IsOptional()
  @IsEnum(HabitFrequency)
  frequency?: HabitFrequency;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  targetDays?: number[];

  @IsOptional()
  @IsEnum(HabitType)
  type?: HabitType;

  @IsOptional()
  @IsNumber()
  targetValue?: number;

  @IsOptional()
  @IsEnum(TimeOfDay)
  timeOfDay?: TimeOfDay;
}
