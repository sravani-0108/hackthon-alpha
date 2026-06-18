import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { AlertSeverity, CaseStatus } from '../types';
import { User } from './User';
import { Investigation } from './Investigation';
import { Alert } from './Alert';
import { Customer } from './Customer';
import { SarReport } from './SarReport';

@Entity('cases')
export class Case {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  case_number!: string;

  @Column({ type: 'int' })
  investigation_id!: number;

  @Column({ type: 'int' })
  alert_id!: number;

  @Column({ type: 'int' })
  customer_id!: number;

  @Index()
  @Column({ type: 'int', nullable: true })
  assigned_to!: number | null;

  @Index()
  @Column({
    type: 'enum',
    enum: ['Open', 'Assigned', 'Under Review', 'Closed', 'SAR Filed'],
    enumName: 'case_status',
    default: 'Open',
  })
  status!: CaseStatus;

  @Column({
    type: 'enum',
    enum: ['Low', 'Medium', 'High', 'Critical'],
    enumName: 'alert_severity',
    default: 'Medium',
  })
  priority!: AlertSeverity;

  @Column({ type: 'text', nullable: true })
  summary!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at!: Date;

  @Column({ type: 'timestamp', nullable: true })
  closed_at!: Date | null;

  @ManyToOne(() => Investigation, (inv) => inv.cases, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'investigation_id' })
  investigation?: Investigation;

  @ManyToOne(() => Alert, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'alert_id' })
  alert?: Alert;

  @ManyToOne(() => Customer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer?: Customer;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assigned_to' })
  assignee?: User;

  @OneToMany(() => SarReport, (sar) => sar.case)
  sarReports?: SarReport[];
}

export default Case;
