import {
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateUserSettingsDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  seenFlags?: string[];

  @IsOptional()
  @IsBoolean()
  weekStartsMonday?: boolean;

  @IsOptional()
  @IsBoolean()
  focusMode?: boolean;

  @IsOptional()
  @IsString()
  @IsIn(['light', 'dark', 'auto'])
  theme?: 'light' | 'dark' | 'auto';
}
