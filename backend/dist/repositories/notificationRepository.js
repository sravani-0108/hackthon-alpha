"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
const Notification_1 = require("../models/Notification");
class NotificationRepository {
    repo() {
        return database_1.AppDataSource.getRepository(Notification_1.Notification);
    }
    async create(data) {
        const notification = this.repo().create(data);
        return this.repo().save(notification);
    }
    async findByUserId(userId, { offset = 0, limit = 20 } = {}) {
        const [rows, count] = await this.repo().findAndCount({
            where: { user_id: userId },
            order: { created_at: 'DESC' },
            skip: offset,
            take: limit,
        });
        return { count, rows };
    }
    async markAsRead(id, userId) {
        const notification = await this.repo().findOne({ where: { id, user_id: userId } });
        if (!notification)
            return null;
        notification.is_read = true;
        return this.repo().save(notification);
    }
}
exports.default = new NotificationRepository();
//# sourceMappingURL=notificationRepository.js.map