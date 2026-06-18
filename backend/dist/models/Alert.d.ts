import { AlertSeverity, AlertStatus } from '../types';
import { Customer } from './Customer';
import { Transaction } from './Transaction';
import { Investigation } from './Investigation';
import { AlertEvidence } from './AlertEvidence';
export declare class Alert {
    id: number;
    alert_code: string | null;
    customer_id: number;
    transaction_id: number | null;
    alert_type: string;
    reason: string | null;
    risk_score: number;
    severity: AlertSeverity;
    status: AlertStatus;
    created_at: Date;
    customer?: Customer;
    transaction?: Transaction;
    investigations?: Investigation[];
    evidence?: AlertEvidence[];
}
export type AlertCreationAttributes = Pick<Alert, 'customer_id' | 'alert_type'> & Partial<Pick<Alert, 'transaction_id' | 'risk_score' | 'severity' | 'status'>>;
export default Alert;
//# sourceMappingURL=Alert.d.ts.map