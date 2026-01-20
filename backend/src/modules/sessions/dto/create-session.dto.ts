import {
  IsNotEmpty,
  IsInt,
  IsDateString,
  IsString,
  MaxLength,
  IsOptional,
  Min,
} from 'class-validator';

export class CreateSessionDto {
  @IsInt()
  @Min(1, { message: 'Le numéro de session doit être supérieur ou égal à 1' })
  @IsNotEmpty({ message: 'Le numéro de session est requis' })
  sessionNumber: number;

  @IsDateString({}, { message: 'Format de date invalide (YYYY-MM-DD attendu)' })
  @IsNotEmpty({ message: 'La date de la session est requise' })
  sessionDate: string;

  @IsString()
  @IsNotEmpty({ message: 'Le label est requis' })
  @MaxLength(100, { message: 'Le label ne peut pas dépasser 100 caractères' })
  label: string;

  @IsString()
  @IsOptional()
  startTime?: string; // HH:MM

  @IsString()
  @IsOptional()
  endTime?: string; // HH:MM

  @IsString()
  @IsOptional()
  @MaxLength(255, { message: 'Le lieu ne peut pas dépasser 255 caractères' })
  location?: string;

  @IsString()
  @IsOptional()
  @MaxLength(170, { message: 'Le titre ne peut pas dépasser 150 caractères' })
  title?: string;
}
