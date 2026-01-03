import {
  IsString,
  IsEnum,
  IsOptional,
  IsDateString,
  MaxLength,
  IsObject,
  ValidateIf,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EventType, EventStatus } from '@/database/entities';

export class UpdateEventDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  title?: string;

  @IsEnum(EventType)
  @IsOptional()
  eventType?: EventType;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  @ValidateIf((o) => o.endDate !== null && o.endDate !== undefined)
  endDate?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  location?: string;

  @IsString()
  @IsOptional()
  @MaxLength(150)
  organizer?: string;

  @IsEnum(EventStatus)
  @IsOptional()
  status?: EventStatus;

  @IsObject()
  @IsOptional()
  additionalInfo?: Record<string, any>;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  capacity?: number;
}
