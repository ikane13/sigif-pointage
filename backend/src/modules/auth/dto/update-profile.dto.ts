import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @IsEmail({}, { message: 'Format email invalide' })
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100, { message: 'Le prénom ne peut pas dépasser 100 caractères' })
  firstName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100, { message: 'Le nom ne peut pas dépasser 100 caractères' })
  lastName?: string;
}
