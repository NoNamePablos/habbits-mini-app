import { Type } from 'class-transformer';
import { IsArray, ValidateNested, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { CreateHabitDto } from './create-habit.dto';

export class BatchCreateHabitsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @Type(() => CreateHabitDto)
  habits: CreateHabitDto[];
}
