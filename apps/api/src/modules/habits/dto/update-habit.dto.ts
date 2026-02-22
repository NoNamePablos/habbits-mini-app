import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsBoolean, IsNumber } from 'class-validator';
import { CreateHabitDto } from './create-habit.dto';

export class UpdateHabitDto extends PartialType(CreateHabitDto) {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}
