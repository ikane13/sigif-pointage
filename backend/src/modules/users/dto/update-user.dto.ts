import { IsEmail, IsString, IsOptional, MaxLength, IsEnum, IsBoolean } from 'class-validator';
import { UserRole } from '@/database/entities';

export class UpdateUserDto {
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

  @IsEnum(UserRole, { message: 'Rôle invalide. Valeurs acceptées: admin, organizer, viewer' })
  @IsOptional()
  role?: UserRole;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
