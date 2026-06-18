import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './User';
import { Case } from './Case';
import { Investigation } from './Investigation';
import { Customer } from './Customer';

@Entity('sar_reports')
export class SarReport {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  case_id!: number;

  @Column({ type: 'int' })
  investigation_id!: number;

  @Column({ type: 'int' })
  customer_id!: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  report_number!: string;

  @Column({ type: 'text' })
  narrative!: string;

  @Column({ type: 'int', nullable: true })
  filed_by!: number | null;

  @Column({ type: 'timestamp', nullable: true })
  filed_at!: Date | null;

  @Column({ type: 'varchar', length: 50, default: 'Draft' })
  status!: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at!: Date;

  @ManyToOne(() => Case, (c) => c.sarReports, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'case_id' })
  case?: Case;

  @ManyToOne(() => Investigation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'investigation_id' })
  investigation?: Investigation;

  @ManyToOne(() => Customer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer?: Customer;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'filed_by' })
  filer?: User;
}

export default SarReport;
