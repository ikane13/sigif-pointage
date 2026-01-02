import { IsString, IsNotEmpty, IsOptional, IsEmail, MaxLength, Matches } from 'class-validator';

export class CreateParticipantDto {
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
  @IsOptional()
  email?: string;

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
