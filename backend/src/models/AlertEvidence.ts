import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Alert } from './Alert';

@Entity('alert_evidence')
export class AlertEvidence {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index()
  @Column({ type: 'int' })
  alert_id!: number;

  @Column({ type: 'varchar', length: 100 })
  evidence_type!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  source!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at!: Date;

  @ManyToOne(() => Alert, (alert) => alert.evidence, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'alert_id' })
  alert?: Alert;
}

export default AlertEvidence;
