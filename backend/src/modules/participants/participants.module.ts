// participants.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParticipantsController } from './participants.controller';
import { ParticipantsPublicController } from './participants-public.controller';
import { ParticipantsService } from './participants.service';
import { Participant } from '@/database/entities';

@Module({
  imports: [TypeOrmModule.forFeature([Participant])],
  controllers: [ParticipantsController, ParticipantsPublicController],
  providers: [ParticipantsService],
  exports: [ParticipantsService], // ✅ Export pour utilisation dans AttendancesModule
})
export class ParticipantsModule {}
