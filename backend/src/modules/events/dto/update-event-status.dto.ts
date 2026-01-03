import { IsEnum } from 'class-validator';
import { EventStatus } from '../../../database/entities/event.entity';

export class UpdateEventStatusDto {
  @IsEnum(EventStatus)
  status: EventStatus;
}
