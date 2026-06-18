import { User } from './User';
import { Case } from './Case';
import { Investigation } from './Investigation';
import { Customer } from './Customer';
export declare class SarReport {
    id: number;
    case_id: number;
    investigation_id: number;
    customer_id: number;
    report_number: string;
    narrative: string;
    filed_by: number | null;
    filed_at: Date | null;
    status: string;
    created_at: Date;
    case?: Case;
    investigation?: Investigation;
    customer?: Customer;
    filer?: User;
}
export default SarReport;
//# sourceMappingURL=SarReport.d.ts.map