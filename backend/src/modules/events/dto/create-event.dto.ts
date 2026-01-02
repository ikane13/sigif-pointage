import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  IsDateString,
  MaxLength,
  IsObject,
  ValidateIf,
} from 'class-validator';
import { EventType } from '@/database/entities';

export class CreateEventDto {
  @IsString()
  @IsNotEmpty({ message: 'Le titre est requis' })
  @MaxLength(255, { message: 'Le titre ne peut pas dépasser 255 caractères' })
  title: string;

  @IsEnum(EventType, {
    message:
      "Type d'événement invalide. Valeurs acceptées: workshop, meeting, committee, training, seminar, other",
  })
  @IsNotEmpty({ message: "Le type d'événement est requis" })
  eventType: EventType;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString({}, { message: 'Format de date invalide (ISO 8601 attendu)' })
  @IsNotEmpty({ message: 'La date de début est requise' })
  startDate: string;

  @IsDateString({}, { message: 'Format de date invalide (ISO 8601 attendu)' })
  @IsOptional()
  @ValidateIf((o) => o.endDate !== null && o.endDate !== undefined)
  endDate?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255, { message: 'Le lieu ne peut pas dépasser 255 caractères' })
  location?: string;

  @IsString()
  @IsOptional()
  @MaxLength(150, { message: "L'organisateur ne peut pas dépasser 150 caractères" })
  organizer?: string;

  @IsObject()
  @IsOptional()
  additionalInfo?: Record<string, any>;
}
