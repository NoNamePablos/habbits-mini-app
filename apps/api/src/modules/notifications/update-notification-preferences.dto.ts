import { IsBoolean, IsOptional, Matches } from 'class-validator';

export class UpdateNotificationPreferencesDto {
  @IsOptional()
  @IsBoolean()
  morningEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  eveningEnabled?: boolean;

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'morningTime must be in HH:mm format',
  })
  morningTime?: string;

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'eveningTime must be in HH:mm format',
  })
  eveningTime?: string;

  @IsOptional()
  @IsBoolean()
  dndEnabled?: boolean;

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'dndStart must be in HH:mm format',
  })
  dndStart?: string;

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'dndEnd must be in HH:mm format',
  })
  dndEnd?: string;
}
