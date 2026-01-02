import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttendancesController } from './attendances.controller';
import { AttendancesService } from './attendances.service';
import { Attendance } from '@/database/entities';
import { ParticipantsModule } from '../participants/participants.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Attendance]),
    ParticipantsModule, // ✅ Import pour utiliser ParticipantsService
    EventsModule, // ✅ Import pour utiliser EventsService
  ],
  controllers: [AttendancesController],
  providers: [AttendancesService],
  exports: [AttendancesService],
})
export class AttendancesModule {}
