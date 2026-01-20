import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CertificatesService } from './certificates.service';
import { CertificatesController } from './certificates.controller';
import { UploadController } from './upload.controller';
import { Certificate } from '@/database/entities/certificate.entity';
import { Attendance } from '@/database/entities/attendance.entity';
import { Participant } from '@/database/entities/participant.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Certificate, Attendance, Participant])],
  controllers: [CertificatesController, UploadController],
  providers: [CertificatesService],
  exports: [CertificatesService],
})
export class CertificatesModule {}
