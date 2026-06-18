import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { AccountType } from '../types';
import { Customer } from './Customer';
import { Transaction } from './Transaction';

@Entity('accounts')
export class Account {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index()
  @Column({ type: 'int' })
  customer_id!: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  account_number!: string;

  @Column({
    type: 'enum',
    enum: ['Savings', 'Current', 'Fixed Deposit', 'NRI'],
    enumName: 'account_type',
    default: 'Savings',
  })
  account_type!: AccountType;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  balance!: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  opened_at!: Date;

  @ManyToOne(() => Customer, (customer) => customer.accounts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer?: Customer;

  @OneToMany(() => Transaction, (transaction) => transaction.account)
  transactions?: Transaction[];
}

export type AccountCreationAttributes = Pick<Account, 'customer_id' | 'account_number'> &
  Partial<Pick<Account, 'account_type' | 'balance'>>;

export default Account;
