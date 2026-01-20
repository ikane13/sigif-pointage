import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { Event } from './event.entity';
import { Participant } from './participant.entity';
import { Attendance } from './attendance.entity';
import { User } from './user.entity';

@Entity('certificates')
@Unique('uniq_event_participant', ['eventId', 'participantId'])
export class Certificate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Relations
  @Column({ name: 'event_id', type: 'uuid' })
  @Index()
  eventId: string;

  @ManyToOne(() => Event, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'event_id' })
  event: Event;

  @Column({ name: 'participant_id', type: 'uuid' })
  @Index()
  participantId: string;

  @ManyToOne(() => Participant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'participant_id' })
  participant: Participant;

  @Column({ name: 'attendance_id', type: 'uuid', nullable: true })
  @Index()
  attendanceId: string;

  @ManyToOne(() => Attendance, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'attendance_id' })
  attendance: Attendance;

  // Numérotation unique
  @Column({ name: 'certificate_number', length: 50, unique: true })
  @Index()
  certificateNumber: string;

  // Données figées de l'événement
  @Column({ name: 'event_title', length: 255 })
  eventTitle: string;

  @Column({ name: 'event_type', length: 50 })
  @Index()
  eventType: string;

  @Column({ name: 'start_date', type: 'timestamp' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'timestamp', nullable: true })
  endDate: Date;

  @Column({ name: 'duration_hours', type: 'decimal', precision: 6, scale: 2, nullable: true })
  durationHours: number;

  @Column({ length: 255, nullable: true })
  location: string;

  @Column({ length: 255, nullable: true })
  organizer: string;

  @Column({ length: 255, nullable: true })
  trainer: string;

  // Date de délivrance
  @Column({ name: 'issued_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  @Index()
  issuedAt: Date;

  // Signataire
  @Column({ name: 'signatory_name', length: 150 })
  signatoryName: string;

  @Column({ name: 'signatory_role', length: 150 })
  signatoryRole: string;

  @Column({ name: 'signature_image_url', length: 500, nullable: true })
  signatureImageUrl: string;

  // Évolutivité future (évaluations, conditions)
  @Column({ name: 'conditions_met', default: true })
  conditionsMet: boolean;

  @Column({ name: 'evaluation_id', type: 'uuid', nullable: true })
  evaluationId: string;

  // Métadonnées
  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  @Index()
  createdById: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
