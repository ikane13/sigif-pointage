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

export enum EntityType {
  USER = 'user',
  EVENT = 'event',
  PARTICIPANT = 'participant',
  ATTENDANCE = 'attendance',
}

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  @Index()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ length: 100 })
  action: string; // Ex: 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', etc.

  @Column({
    name: 'entity_type',
    type: 'enum',
    enum: EntityType,
  })
  @Index()
  entityType: EntityType;

  @Column({ name: 'entity_id', type: 'uuid', nullable: true })
  @Index()
  entityId: string;

  @Column({ name: 'old_values', type: 'jsonb', nullable: true })
  oldValues: Record<string, any>;

  @Column({ name: 'new_values', type: 'jsonb', nullable: true })
  newValues: Record<string, any>;

  @Column({ name: 'ip_address', type: 'inet', nullable: true })
  ipAddress: string;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string;

  @CreateDateColumn({ name: 'created_at' })
  @Index()
  createdAt: Date;
}