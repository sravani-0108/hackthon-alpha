import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { TransactionType, TransactionStatus } from '../types';
import { Account } from './Account';
import { Alert } from './Alert';

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index()
  @Column({ type: 'int' })
  account_id!: number;

  @Index()
  @Column({ type: 'decimal', precision: 18, scale: 2 })
  amount!: number;

  @Index()
  @Column({
    type: 'enum',
    enum: ['Credit', 'Debit', 'Transfer', 'Withdrawal', 'Deposit'],
    enumName: 'transaction_type',
  })
  transaction_type!: TransactionType;

  @Column({ type: 'varchar', length: 50, nullable: true })
  sender_account!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  receiver_account!: string | null;

  @Index()
  @Column({ type: 'varchar', length: 100, nullable: true })
  country!: string | null;

  @Index()
  @Column({ type: 'timestamp' })
  transaction_date!: Date;

  @Column({
    type: 'enum',
    enum: ['Pending', 'Completed', 'Failed', 'Reversed'],
    enumName: 'transaction_status',
    default: 'Completed',
  })
  status!: TransactionStatus;

  @ManyToOne(() => Account, (account) => account.transactions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'account_id' })
  account?: Account;

  @OneToMany(() => Alert, (alert) => alert.transaction)
  alerts?: Alert[];
}

export type TransactionCreationAttributes = Pick<
  Transaction,
  'account_id' | 'amount' | 'transaction_type' | 'transaction_date'
> &
  Partial<Pick<Transaction, 'sender_account' | 'receiver_account' | 'country' | 'status'>>;

export default Transaction;
