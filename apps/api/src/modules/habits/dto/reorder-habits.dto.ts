import { IsArray, IsInt, ArrayNotEmpty } from 'class-validator';

export class ReorderHabitsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  orderedIds: number[];
}
