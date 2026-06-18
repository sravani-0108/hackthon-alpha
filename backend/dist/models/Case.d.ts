import { AlertSeverity, CaseStatus } from '../types';
import { User } from './User';
import { Investigation } from './Investigation';
import { Alert } from './Alert';
import { Customer } from './Customer';
import { SarReport } from './SarReport';
export declare class Case {
    id: number;
    case_number: string;
    investigation_id: number;
    alert_id: number;
    customer_id: number;
    assigned_to: number | null;
    status: CaseStatus;
    priority: AlertSeverity;
    summary: string | null;
    created_at: Date;
    closed_at: Date | null;
    investigation?: Investigation;
    alert?: Alert;
    customer?: Customer;
    assignee?: User;
    sarReports?: SarReport[];
}
export default Case;
//# sourceMappingURL=Case.d.ts.map