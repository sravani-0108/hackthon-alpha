import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { UserRole } from '../types';
import { Investigation } from './Investigation';
import { Notification } from './Notification';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 150 })
  name!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 255 })
  password_hash!: string;

  @Column({ type: 'text', nullable: true })
  refresh_token!: string | null;

  @Column({ type: 'enum', enum: ['bank_manager', 'admin'], enumName: 'user_role', default: 'bank_manager' })
  role!: UserRole;

  @CreateDateColumn({ name: 'created_at' })
  created_at!: Date;

  @OneToMany(() => Investigation, (investigation) => investigation.manager)
  investigations?: Investigation[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications?: Notification[];
}

export type UserCreationAttributes = Pick<User, 'name' | 'email' | 'password_hash'> & {
  role?: UserRole;
};

export default User;
