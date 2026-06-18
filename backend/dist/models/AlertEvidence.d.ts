import { Alert } from './Alert';
export declare class AlertEvidence {
    id: number;
    alert_id: number;
    evidence_type: string;
    description: string;
    source: string | null;
    metadata: Record<string, unknown> | null;
    created_at: Date;
    alert?: Alert;
}
export default AlertEvidence;
//# sourceMappingURL=AlertEvidence.d.ts.map