import { IsOptional, IsNumber, IsString } from 'class-validator';

export class CompleteHabitDto {
  @IsOptional()
  @IsNumber()
  value?: number;

  @IsOptional()
  @IsString()
  note?: string;
}
