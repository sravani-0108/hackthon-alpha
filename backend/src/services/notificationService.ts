import { Server as SocketServer } from 'socket.io';
import notificationRepository from '../repositories/notificationRepository';
import userRepository from '../repositories/userRepository';
import { Alert } from '../models/Alert';
import { Customer } from '../models/Customer';

let io: SocketServer | null = null;

class NotificationService {
  setSocketIO(socketIO: SocketServer): void {
    io = socketIO;
  }

  async createInAppNotification(userId: number, title: string, message: string) {
    const notification = await notificationRepository.create({
      title,
      message,
      user_id: userId,
      is_read: false,
    });

    if (io) {
      io.to(`user_${userId}`).emit('notification', {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        is_read: notification.is_read,
        created_at: notification.created_at,
      });
    }

    return notification;
  }

  async notifyAllManagers(title: string, message: string) {
    const managers = await userRepository.findAllManagers();

    return Promise.all(
      managers.map((manager) => this.createInAppNotification(manager.id, title, message))
    );
  }

  async notifyNewAlert(alert: Alert, customer: Customer) {
    const title = 'New AML Alert';
    const message = `New ${alert.alert_type} alert for customer ${customer.name} (${customer.customer_number}). Severity: ${alert.severity}`;
    return this.notifyAllManagers(title, message);
  }

  async notifyHighRiskCustomer(customer: Customer) {
    const title = 'High Risk Customer Detected';
    const message = `Customer ${customer.name} (${customer.customer_number}) has been classified as High Risk with score ${customer.risk_score}.`;
    return this.notifyAllManagers(title, message);
  }

  async notifyAlertEscalated(alert: Alert, customer: Customer) {
    const title = 'Alert Escalated';
    const message = `Alert #${alert.id} for customer ${customer.name} has been escalated. Type: ${alert.alert_type}`;
    return this.notifyAllManagers(title, message);
  }

  async notifyInvestigationComplete(alert: Alert, decision: string, confidence: number) {
    const title = `AI Investigation Complete: ${decision}`;
    const message = `Alert #${alert.id} (${alert.alert_type}) — AI decision: ${decision} (${confidence}% confidence).`;
    return this.notifyAllManagers(title, message);
  }
}

export default new NotificationService();
