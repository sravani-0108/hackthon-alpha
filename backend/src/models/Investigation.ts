import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { InvestigationStatus, AiDecisionType } from '../types';
import { Alert } from './Alert';
import { User } from './User';
import { AgentResult } from './AgentResult';
import { Case } from './Case';

@Entity('investigations')
export class Investigation {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index()
  @Column({ type: 'int' })
  alert_id!: number;

  @Index()
  @Column({ type: 'int', nullable: true })
  manager_id!: number | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Index()
  @Column({
    type: 'enum',
    enum: ['Open', 'Under Investigation', 'Legitimate', 'Escalated', 'Closed', 'Completed'],
    enumName: 'investigation_status',
    default: 'Open',
  })
  status!: InvestigationStatus;

  @Column({
    type: 'enum',
    enum: ['CLEAR', 'ESCALATE', 'SAR'],
    enumName: 'ai_decision_type',
    nullable: true,
  })
  ai_decision!: AiDecisionType | null;

  @Column({ type: 'int', nullable: true })
  confidence!: number | null;

  @Column({ type: 'text', nullable: true })
  report_summary!: string | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  started_at!: Date;

  @Column({ type: 'timestamp', nullable: true })
  completed_at!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at!: Date;

  @ManyToOne(() => Alert, (alert) => alert.investigations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'alert_id' })
  alert?: Alert;

  @ManyToOne(() => User, (user) => user.investigations, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'manager_id' })
  manager?: User;

  @OneToMany(() => AgentResult, (result) => result.investigation)
  agentResults?: AgentResult[];

  @OneToMany(() => Case, (c) => c.investigation)
  cases?: Case[];
}

export type InvestigationCreationAttributes = Pick<Investigation, 'alert_id'> &
  Partial<Pick<Investigation, 'manager_id' | 'notes' | 'status'>>;

export default Investigation;
