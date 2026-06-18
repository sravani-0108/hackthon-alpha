"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const notificationRepository_1 = __importDefault(require("../repositories/notificationRepository"));
const userRepository_1 = __importDefault(require("../repositories/userRepository"));
let io = null;
class NotificationService {
    setSocketIO(socketIO) {
        io = socketIO;
    }
    async createInAppNotification(userId, title, message) {
        const notification = await notificationRepository_1.default.create({
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
    async notifyAllManagers(title, message) {
        const managers = await userRepository_1.default.findAllManagers();
        return Promise.all(managers.map((manager) => this.createInAppNotification(manager.id, title, message)));
    }
    async notifyNewAlert(alert, customer) {
        const title = 'New AML Alert';
        const message = `New ${alert.alert_type} alert for customer ${customer.name} (${customer.customer_number}). Severity: ${alert.severity}`;
        return this.notifyAllManagers(title, message);
    }
    async notifyHighRiskCustomer(customer) {
        const title = 'High Risk Customer Detected';
        const message = `Customer ${customer.name} (${customer.customer_number}) has been classified as High Risk with score ${customer.risk_score}.`;
        return this.notifyAllManagers(title, message);
    }
    async notifyAlertEscalated(alert, customer) {
        const title = 'Alert Escalated';
        const message = `Alert #${alert.id} for customer ${customer.name} has been escalated. Type: ${alert.alert_type}`;
        return this.notifyAllManagers(title, message);
    }
    async notifyInvestigationComplete(alert, decision, confidence) {
        const title = `AI Investigation Complete: ${decision}`;
        const message = `Alert #${alert.id} (${alert.alert_type}) — AI decision: ${decision} (${confidence}% confidence).`;
        return this.notifyAllManagers(title, message);
    }
}
exports.default = new NotificationService();
//# sourceMappingURL=notificationService.js.map