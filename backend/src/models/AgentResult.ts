import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { AgentType } from '../types';
import { Investigation } from './Investigation';

@Entity('agent_results')
export class AgentResult {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index()
  @Column({ type: 'int' })
  investigation_id!: number;

  @Index()
  @Column({ type: 'enum', enum: [
    'customer_analysis', 'transaction_analysis', 'sanctions_check',
    'pep_check', 'media_analysis', 'investigation', 'decision', 'report',
  ], enumName: 'agent_type' })
  agent_type!: AgentType;

  @Column({ type: 'jsonb' })
  result!: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  created_at!: Date;

  @ManyToOne(() => Investigation, (inv) => inv.agentResults, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'investigation_id' })
  investigation?: Investigation;
}

export default AgentResult;
