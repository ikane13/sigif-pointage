import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

export enum NotificationType {
  EVENT_CREATED = 'event.created',
  EVENT_DELETED = 'event.deleted',
  EVENT_CANCELLED = 'event.cancelled',
  SESSION_CANCELLED = 'session.cancelled',
  ATTENDANCE_DELETED = 'attendance.deleted',
}

export enum NotificationEntityType {
  EVENT = 'event',
  SESSION = 'session',
  ATTENDANCE = 'attendance',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'recipient_id', type: 'uuid' })
  @Index()
  recipientId: string;

  @Column({ name: 'actor_id', type: 'uuid', nullable: true })
  actorId?: string | null;

  @Column({ name: 'actor_role', length: 20, nullable: true })
  actorRole?: string | null;

  @Column({ length: 50 })
  type: NotificationType;

  @Column({ name: 'entity_type', length: 20, nullable: true })
  entityType?: NotificationEntityType | null;

  @Column({ name: 'entity_id', type: 'uuid', nullable: true })
  entityId?: string | null;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  message?: string | null;

  @Column({ type: 'jsonb', nullable: true })
  payload?: Record<string, any> | null;

  @Column({ name: 'read_at', type: 'timestamp', nullable: true })
  readAt?: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recipient_id' })
  recipient: User;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'actor_id' })
  actor?: User | null;
}
