import { AppDataSource } from '../config/database';
import { Notification, NotificationCreationAttributes } from '../models/Notification';

class NotificationRepository {
  private repo() {
    return AppDataSource.getRepository(Notification);
  }

  async create(data: NotificationCreationAttributes): Promise<Notification> {
    const notification = this.repo().create(data);
    return this.repo().save(notification);
  }

  async findByUserId(userId: number, { offset = 0, limit = 20 } = {}) {
    const [rows, count] = await this.repo().findAndCount({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
      skip: offset,
      take: limit,
    });

    return { count, rows };
  }

  async markAsRead(id: number, userId: number): Promise<Notification | null> {
    const notification = await this.repo().findOne({ where: { id, user_id: userId } });
    if (!notification) return null;

    notification.is_read = true;
    return this.repo().save(notification);
  }
}

export default new NotificationRepository();
