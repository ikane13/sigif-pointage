import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attendance } from '@/database/entities';
import { ParticipantsModule } from '../participants/participants.module';
import { EventsModule } from '../events/events.module';
import { SessionsModule } from '../sessions/sessions.module';
import { NotificationsModule } from '../notifications/notifications.module';

import { AttendancesController } from './attendances.controller';
import { SessionsAttendancesController } from './sessions-attendances.controller';
import { AttendancesService } from './attendances.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Attendance]),
    ParticipantsModule,
    EventsModule,
    SessionsModule,
    NotificationsModule,
  ],
  controllers: [
    AttendancesController,
    SessionsAttendancesController, // ✅ ici
  ],
  providers: [AttendancesService],
  exports: [AttendancesService],
})
export class AttendancesModule {}
