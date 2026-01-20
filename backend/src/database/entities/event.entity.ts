import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Attendance } from './attendance.entity';
import { Session } from './session.entity';

export enum EventType {
  WORKSHOP = 'workshop',
  MEETING = 'meeting',
  COMMITTEE = 'committee',
  TRAINING = 'training',
  SEMINAR = 'seminar',
  OTHER = 'other',
}

export enum EventStatus {
  SCHEDULED = 'scheduled',
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  title: string;

  @Column({
    name: 'event_type',
    type: 'enum',
    enum: EventType,
  })
  @Index()
  eventType: EventType;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'start_date', type: 'timestamp' })
  @Index()
  startDate: Date;

  @Column({ name: 'end_date', type: 'timestamp', nullable: true })
  endDate: Date;

  @Column({ length: 255, nullable: true })
  location: string;

  @Column({ length: 150, nullable: true })
  organizer: string;

  @Column({
    type: 'enum',
    enum: EventStatus,
    default: EventStatus.SCHEDULED,
  })
  @Index()
  status: EventStatus;

  @Column({ name: 'additional_info', type: 'jsonb', nullable: true })
  additionalInfo: Record<string, any>;

  @Column({ type: 'integer', nullable: true })
  capacity: number;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  @Index()
  createdById: string;

  @Column({ type: 'varchar', length: 64, unique: true, nullable: true })
  @Index()
  qrToken: string;

  @Column({ type: 'timestamp', nullable: true })
  qrGeneratedAt: Date;

  @Column({ type: 'integer', default: 0 })
  qrScanCount: number;

  @ManyToOne(() => User, (user) => user.events, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Attendance, (attendance) => attendance.event)
  attendances: Attendance[];

  @OneToMany(() => Session, (session) => session.event)
  sessions: Session[];
}
