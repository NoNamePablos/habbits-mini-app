import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CheckInChallengeDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
