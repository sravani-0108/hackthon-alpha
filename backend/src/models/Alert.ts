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
import { AlertSeverity, AlertStatus } from '../types';
import { Customer } from './Customer';
import { Transaction } from './Transaction';
import { Investigation } from './Investigation';
import { AlertEvidence } from './AlertEvidence';

@Entity('alerts')
export class Alert {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index()
  @Column({ type: 'varchar', length: 50, nullable: true })
  alert_code!: string | null;

  @Index()
  @Column({ type: 'int' })
  customer_id!: number;

  @Index()
  @Column({ type: 'int', nullable: true })
  transaction_id!: number | null;

  @Index()
  @Column({ type: 'varchar', length: 100 })
  alert_type!: string;

  @Column({ type: 'text', nullable: true })
  reason!: string | null;

  @Column({ type: 'int', default: 0 })
  risk_score!: number;

  @Index()
  @Column({
    type: 'enum',
    enum: ['Low', 'Medium', 'High', 'Critical'],
    enumName: 'alert_severity',
    default: 'Medium',
  })
  severity!: AlertSeverity;

  @Index()
  @Column({
    type: 'enum',
    enum: ['Open', 'Under Investigation', 'Escalated', 'Closed', 'Cleared'],
    enumName: 'alert_status',
    default: 'Open',
  })
  status!: AlertStatus;

  @Index()
  @CreateDateColumn({ name: 'created_at' })
  created_at!: Date;

  @ManyToOne(() => Customer, (customer) => customer.alerts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer?: Customer;

  @ManyToOne(() => Transaction, (transaction) => transaction.alerts, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'transaction_id' })
  transaction?: Transaction;

  @OneToMany(() => Investigation, (investigation) => investigation.alert)
  investigations?: Investigation[];

  @OneToMany(() => AlertEvidence, (evidence) => evidence.alert)
  evidence?: AlertEvidence[];
}

export type AlertCreationAttributes = Pick<Alert, 'customer_id' | 'alert_type'> &
  Partial<Pick<Alert, 'transaction_id' | 'risk_score' | 'severity' | 'status'>>;

export default Alert;
