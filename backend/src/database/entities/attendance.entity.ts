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
import { Session } from './session.entity';

export enum CheckInMode {
  QR_CODE = 'qr_code',
  MANUAL = 'manual',
  IMPORT = 'import',
}

export enum SignatureFormat {
  PNG = 'png',
  JPG = 'jpg',
  SVG = 'svg',
  BASE64 = 'base64',
}

@Entity('attendances')
@Unique('uniq_participant_session', ['participantId', 'sessionId'])
export class Attendance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'event_id', type: 'uuid' })
  @Index()
  eventId: string;

  @ManyToOne(() => Event, (event) => event.attendances, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'event_id' })
  event: Event;

  @Column({ name: 'participant_id', type: 'uuid' })
  @Index()
  participantId: string;

  @ManyToOne(() => Participant, (participant) => participant.attendances, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'participant_id' })
  participant: Participant;

  @Column({ name: 'session_id', type: 'uuid', nullable: false })
  @Index()
  sessionId: string;

  @ManyToOne(() => Session, (session) => session.attendances, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'session_id' })
  session: Session;

  @Column({ name: 'check_in_time', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  @Index()
  checkInTime: Date;

  @Column({
    name: 'check_in_mode',
    type: 'enum',
    enum: CheckInMode,
    default: CheckInMode.QR_CODE,
  })
  checkInMode: CheckInMode;

  @Column({ name: 'signature_data', type: 'text', nullable: true })
  signatureData: string; // Base64 encoded image

  @Column({
    name: 'signature_format',
    type: 'enum',
    enum: SignatureFormat,
    default: SignatureFormat.PNG,
    nullable: true,
  })
  signatureFormat: SignatureFormat;

  @Column({ name: 'ip_address', type: 'inet', nullable: true })
  ipAddress: string;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
