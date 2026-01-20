import { Exclude, Expose, Type } from 'class-transformer';

@Exclude()
class CertificateParticipantDto {
  @Expose()
  id: string;

  @Expose()
  firstName: string;

  @Expose()
  lastName: string;

  @Expose()
  email: string;
}

@Exclude()
class CertificateEventDto {
  @Expose()
  id: string;

  @Expose()
  title: string;

  @Expose()
  eventType: string;
}

@Exclude()
export class CertificateResponseDto {
  @Expose()
  id: string;

  @Expose()
  eventId: string;

  @Expose()
  participantId: string;

  @Expose()
  attendanceId?: string;

  @Expose()
  certificateNumber: string;

  @Expose()
  eventTitle: string;

  @Expose()
  eventType: string;

  @Expose()
  startDate: Date;

  @Expose()
  endDate?: Date;

  @Expose()
  durationHours?: number;

  @Expose()
  location?: string;

  @Expose()
  organizer?: string;

  @Expose()
  trainer?: string;

  @Expose()
  issuedAt: Date;

  @Expose()
  signatoryName: string;

  @Expose()
  signatoryRole: string;

  @Expose()
  signatureImageUrl?: string;

  @Expose()
  conditionsMet: boolean;

  @Expose()
  evaluationId?: string;

  @Expose()
  createdById?: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  // Relations optionnelles (si chargées)
  @Expose()
  @Type(() => CertificateParticipantDto)
  participant?: CertificateParticipantDto;

  @Expose()
  @Type(() => CertificateEventDto)
  event?: CertificateEventDto;
}
