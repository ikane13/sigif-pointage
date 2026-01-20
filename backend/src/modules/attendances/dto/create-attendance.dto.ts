import {
  IsUUID,
  IsString,
  IsEmail,
  IsOptional,
  IsNotEmpty,
  MaxLength,
  MinLength,
  Matches,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO pour les informations du participant lors du pointage
 */
export class CreateParticipantForAttendanceDto {
  @IsString()
  @IsNotEmpty({ message: 'Le prénom est requis' })
  @MaxLength(100, { message: 'Le prénom ne peut pas dépasser 100 caractères' })
  firstName: string;

  @IsString()
  @IsNotEmpty({ message: 'Le nom est requis' })
  @MaxLength(100, { message: 'Le nom ne peut pas dépasser 100 caractères' })
  lastName: string;

  @IsString()
  @IsOptional()
  @MaxLength(150, { message: 'La fonction ne peut pas dépasser 150 caractères' })
  function?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50, { message: 'Le numéro CNI ne peut pas dépasser 50 caractères' })
  @Matches(/^[A-Z0-9]{8,20}$/, {
    message: 'Format CNI invalide (8-20 caractères alphanumériques majuscules)',
  })
  cniNumber?: string;

  @IsString()
  @IsOptional()
  @MaxLength(150, { message: 'La localité ne peut pas dépasser 150 caractères' })
  originLocality?: string;

  @IsEmail({}, { message: 'Format email invalide' })
  @IsNotEmpty({ message: "L'email est requis" })
  email: string;

  @IsString()
  @IsOptional()
  @Matches(/^\+?[0-9\s\-()]{8,20}$/, {
    message: 'Format téléphone invalide',
  })
  phone?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255, { message: "L'organisation ne peut pas dépasser 255 caractères" })
  organization?: string;
}

/**
 * DTO principal pour créer une présence (pointage)
 */
export class CreateAttendanceDto {
  @IsUUID('4', { message: 'ID événement invalide' })
  @IsNotEmpty({ message: "L'ID de l'événement est requis" })
  eventId: string;

  @ValidateNested()
  @Type(() => CreateParticipantForAttendanceDto)
  @IsNotEmpty({ message: 'Les informations du participant sont requises' })
  participant: CreateParticipantForAttendanceDto;

  @IsString()
  @IsNotEmpty({ message: 'La signature est requise' })
  @MinLength(100, { message: 'Signature invalide (trop courte)' })
  @MaxLength(100000, { message: 'La signature dépasse la taille maximale autorisée (100KB)' })
  @Matches(/^data:image\/(png|jpeg|jpg);base64,/, {
    message: 'Format signature invalide (PNG ou JPEG base64 attendu)',
  })
  signature: string;

  @IsString()
  @IsOptional()
  @MaxLength(500, { message: 'Les notes ne peuvent pas dépasser 500 caractères' })
  notes?: string;

  @IsUUID('4', { message: 'ID session invalide' })
  @IsNotEmpty({ message: "L'ID de la session est requis" })
  sessionId: string;
}
