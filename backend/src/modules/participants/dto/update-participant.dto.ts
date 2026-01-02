import { IsString, IsOptional, IsEmail, MaxLength, Matches } from 'class-validator';

export class UpdateParticipantDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  firstName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  lastName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(150)
  function?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  @Matches(/^[A-Z0-9]{8,20}$/, {
    message: 'Format CNI invalide (8-20 caractères alphanumériques majuscules)',
  })
  cniNumber?: string;

  @IsString()
  @IsOptional()
  @MaxLength(150)
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
  @MaxLength(255)
  organization?: string;
}
