import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { User } from './User';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text' })
  message!: string;

  @Index()
  @Column({ type: 'int' })
  user_id!: number;

  @Index()
  @Column({ type: 'boolean', default: false })
  is_read!: boolean;

  @Index()
  @CreateDateColumn({ name: 'created_at' })
  created_at!: Date;

  @ManyToOne(() => User, (user) => user.notifications, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: User;
}

export type NotificationCreationAttributes = Pick<Notification, 'title' | 'message' | 'user_id'> &
  Partial<Pick<Notification, 'is_read'>>;

export default Notification;
