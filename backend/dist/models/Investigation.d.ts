import { InvestigationStatus, AiDecisionType } from '../types';
import { Alert } from './Alert';
import { User } from './User';
import { AgentResult } from './AgentResult';
import { Case } from './Case';
export declare class Investigation {
    id: number;
    alert_id: number;
    manager_id: number | null;
    notes: string | null;
    status: InvestigationStatus;
    ai_decision: AiDecisionType | null;
    confidence: number | null;
    report_summary: string | null;
    started_at: Date;
    completed_at: Date | null;
    created_at: Date;
    alert?: Alert;
    manager?: User;
    agentResults?: AgentResult[];
    cases?: Case[];
}
export type InvestigationCreationAttributes = Pick<Investigation, 'alert_id'> & Partial<Pick<Investigation, 'manager_id' | 'notes' | 'status'>>;
export default Investigation;
//# sourceMappingURL=Investigation.d.ts.map