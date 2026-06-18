import { AlertSeverity, AlertStatus, CreateAlertInput } from '../types';
import { Alert } from '../models/Alert';
declare class AlertGenerationService {
    createAlert({ customerId, transactionId, alertType, riskScore, severity, status, }: CreateAlertInput & {
        status?: AlertStatus;
        severity?: AlertSeverity;
    }): Promise<Alert>;
}
declare const _default: AlertGenerationService;
export default _default;
//# sourceMappingURL=alertGenerationService.d.ts.map