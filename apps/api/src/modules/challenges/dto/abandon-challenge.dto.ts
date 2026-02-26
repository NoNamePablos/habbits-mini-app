import { IsString, IsOptional, MaxLength } from 'class-validator';

export class AbandonChallengeDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;
}
