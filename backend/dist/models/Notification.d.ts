import { User } from './User';
export declare class Notification {
    id: number;
    title: string;
    message: string;
    user_id: number;
    is_read: boolean;
    created_at: Date;
    user?: User;
}
export type NotificationCreationAttributes = Pick<Notification, 'title' | 'message' | 'user_id'> & Partial<Pick<Notification, 'is_read'>>;
export default Notification;
//# sourceMappingURL=Notification.d.ts.map