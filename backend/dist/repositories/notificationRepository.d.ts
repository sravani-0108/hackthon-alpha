import { Notification, NotificationCreationAttributes } from '../models/Notification';
declare class NotificationRepository {
    private repo;
    create(data: NotificationCreationAttributes): Promise<Notification>;
    findByUserId(userId: number, { offset, limit }?: {
        offset?: number | undefined;
        limit?: number | undefined;
    }): Promise<{
        count: number;
        rows: Notification[];
    }>;
    markAsRead(id: number, userId: number): Promise<Notification | null>;
}
declare const _default: NotificationRepository;
export default _default;
//# sourceMappingURL=notificationRepository.d.ts.map