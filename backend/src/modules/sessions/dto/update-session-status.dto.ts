import { IsEnum } from 'class-validator';
import { SessionStatus } from '@/database/entities';

export class UpdateSessionStatusDto {
  @IsEnum(SessionStatus, { message: 'Statut invalide.' })
  status: SessionStatus;
}
