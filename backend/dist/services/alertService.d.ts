import { CreateAlertInput, QueryFilters } from '../types';
import { AlertSeverity, AlertStatus } from '../types';
declare class AlertService {
    getAlerts(query: QueryFilters): Promise<{
        alerts: import("../models").Alert[];
        pagination: import("../types").PaginationMeta;
    }>;
    getAlertById(id: number): Promise<{
        summary: {
            id: number;
            alert_code: string | null;
            alert_type: string;
            reason: string | null;
            risk_score: number;
            severity: AlertSeverity;
            status: AlertStatus;
            created_at: Date;
        };
        triggeredRule: string;
        customer: import("../models").Customer | undefined;
        relatedTransaction: import("../models").Transaction | undefined;
    }>;
    createAlert(data: CreateAlertInput): Promise<import("../models").Alert>;
    updateAlert(id: number, data: Partial<{
        status: AlertStatus;
        severity: AlertSeverity;
        risk_score: number;
    }>): Promise<import("../models").Alert | null>;
    updateAlertStatus(id: number, status: AlertStatus): Promise<import("../models").Alert | null>;
}
declare const _default: AlertService;
export default _default;
//# sourceMappingURL=alertService.d.ts.map