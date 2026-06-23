import { Alert, AlertCreationAttributes } from '../models/Alert';
import { AlertSeverity, AlertStatus } from '../types';
interface FindAllParams {
    offset: number;
    limit: number | null;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
    status?: AlertStatus;
    severity?: AlertSeverity;
    alertType?: string;
}
declare class AlertRepository {
    private repo;
    findAll({ offset, limit, search, sortBy, sortOrder, status, severity, alertType }: FindAllParams): Promise<{
        count: number;
        rows: Alert[];
    }>;
    findById(id: number): Promise<Alert | null>;
    create(alertData: AlertCreationAttributes): Promise<Alert>;
    update(id: number, updateData: Partial<AlertCreationAttributes>): Promise<Alert | null>;
    countByStatus(status: AlertStatus): Promise<number>;
    countOpen(): Promise<number>;
    countHighAndCritical(): Promise<number>;
    countAll(): Promise<number>;
}
declare const _default: AlertRepository;
export default _default;
//# sourceMappingURL=alertRepository.d.ts.map