import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  Index,
  Unique,
} from 'typeorm';
import { Event } from './event.entity';
import { Attendance } from './attendance.entity';

export enum SessionStatus {
  SCHEDULED = 'scheduled',
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('sessions')
@Unique('uniq_event_session_number', ['eventId', 'sessionNumber'])
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  eventId: string;

  @ManyToOne(() => Event, (event) => event.sessions, {
    onDelete: 'CASCADE',
  })
  event: Event;

  @Column({ type: 'integer' })
  sessionNumber: number;

  @Column({ type: 'date' })
  sessionDate: Date;

  @Column({ length: 100 })
  label: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  title?: string;

  @Column({ type: 'time', nullable: true })
  startTime?: string;

  @Column({ type: 'time', nullable: true })
  endTime?: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: SessionStatus.SCHEDULED,
  })
  @Index()
  status: SessionStatus;

  @Column({ length: 255, nullable: true })
  location?: string;

  @Column({ type: 'varchar', length: 64, unique: true, nullable: true })
  @Index()
  qrToken?: string;

  @Column({ type: 'timestamp', nullable: true })
  qrGeneratedAt?: Date;

  @Column({ type: 'integer', default: 0 })
  qrScanCount: number;

  @OneToMany(() => Attendance, (attendance) => attendance.session)
  attendances: Attendance[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
