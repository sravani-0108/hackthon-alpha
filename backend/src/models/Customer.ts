import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { RiskCategory } from '../types';
import { Account } from './Account';
import { Alert } from './Alert';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  customer_number!: string;

  @Index()
  @Column({ type: 'varchar', length: 200 })
  name!: string;

  @Column({ type: 'date', nullable: true })
  dob!: string | null;

  @Column({ type: 'text', nullable: true })
  address!: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  pan!: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  aadhaar!: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  occupation!: string | null;

  @Index()
  @Column({ type: 'varchar', length: 100, default: 'India' })
  country!: string;

  @Index()
  @Column({ type: 'boolean', default: false })
  is_pep!: boolean;

  @Index()
  @Column({ type: 'int', default: 0 })
  risk_score!: number;

  @Index()
  @Column({ type: 'enum', enum: ['Low', 'Medium', 'High'], enumName: 'risk_category', default: 'Low' })
  risk_category!: RiskCategory;

  @CreateDateColumn({ name: 'created_at' })
  created_at!: Date;

  @OneToMany(() => Account, (account) => account.customer)
  accounts?: Account[];

  @OneToMany(() => Alert, (alert) => alert.customer)
  alerts?: Alert[];
}

export type CustomerCreationAttributes = Partial<
  Pick<Customer, 'dob' | 'address' | 'pan' | 'aadhaar' | 'occupation' | 'country' | 'is_pep' | 'risk_score' | 'risk_category'>
> &
  Pick<Customer, 'customer_number' | 'name'>;

export default Customer;
