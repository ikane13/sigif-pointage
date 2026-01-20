import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateSessionDto } from './create-session.dto';
import { SessionStatus } from '@/database/entities';

export class UpdateSessionDto extends PartialType(CreateSessionDto) {
  @IsEnum(SessionStatus, {
    message: 'Statut invalide. Valeurs acceptées: scheduled, ongoing, completed, cancelled',
  })
  @IsOptional()
  status?: SessionStatus;
}
