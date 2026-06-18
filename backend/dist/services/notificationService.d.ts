import { Server as SocketServer } from 'socket.io';
import { Alert } from '../models/Alert';
import { Customer } from '../models/Customer';
declare class NotificationService {
    setSocketIO(socketIO: SocketServer): void;
    createInAppNotification(userId: number, title: string, message: string): Promise<import("../models").Notification>;
    notifyAllManagers(title: string, message: string): Promise<import("../models").Notification[]>;
    notifyNewAlert(alert: Alert, customer: Customer): Promise<import("../models").Notification[]>;
    notifyHighRiskCustomer(customer: Customer): Promise<import("../models").Notification[]>;
    notifyAlertEscalated(alert: Alert, customer: Customer): Promise<import("../models").Notification[]>;
    notifyInvestigationComplete(alert: Alert, decision: string, confidence: number): Promise<import("../models").Notification[]>;
}
declare const _default: NotificationService;
export default _default;
//# sourceMappingURL=notificationService.d.ts.map