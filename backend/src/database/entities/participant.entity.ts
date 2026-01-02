// participant.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Attendance } from './attendance.entity';

@Entity('participants')
@Index('idx_participants_fulltext', { synchronize: false }) // Index créé manuellement en SQL
export class Participant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'first_name', length: 100 })
  @Index()
  firstName: string;

  @Column({ name: 'last_name', length: 100 })
  @Index()
  lastName: string;

  @Column({ length: 150, nullable: true })
  function: string;

  @Column({ name: 'cni_number', length: 50, unique: true, nullable: true })
  @Index()
  cniNumber: string;

  @Column({ name: 'origin_locality', length: 150, nullable: true })
  originLocality: string;

  @Column({ length: 255, nullable: true })
  @Index()
  email: string;

  @Column({ length: 20, nullable: true })
  phone: string;

  @Column({ length: 255, nullable: true })
  @Index()
  organization: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => Attendance, (attendance) => attendance.participant)
  attendances: Attendance[];

  // Méthode helper pour le nom complet
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
