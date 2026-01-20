import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsOptional,
  IsNumber,
  IsDateString,
  IsBoolean,
  Min,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCertificateDto {
  @IsUUID()
  @IsNotEmpty()
  participantId: string;

  @IsUUID()
  @IsOptional()
  attendanceId?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  eventTitle: string;

  @IsString()
  @IsNotEmpty()
  eventType: string;

  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  durationHours?: number;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  location?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  organizer?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  trainer?: string;

  @IsDateString()
  @IsOptional()
  issuedAt?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  signatoryName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  signatoryRole: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  signatureImageUrl?: string;

  @IsBoolean()
  @IsOptional()
  conditionsMet?: boolean;

  @IsUUID()
  @IsOptional()
  evaluationId?: string;
}
