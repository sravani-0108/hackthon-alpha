import { Investigation } from '../models/Investigation';
import { InvestigationAction, QueryFilters } from '../types';
import { InvestigationStatus } from '../types';
interface CreateInvestigationInput {
    alertId: number;
    managerId?: number;
    notes?: string;
    action?: InvestigationAction;
}
type StageStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
interface InvestigationStage {
    name: 'Internal Data Analysis' | 'External Screening' | 'Investigation & Decision';
    status: StageStatus;
    summary: string;
}
declare class InvestigationService {
    private inferRiskLevel;
    private buildStageSummary;
    private buildStages;
    startAiInvestigation(alertId: number, managerId?: number): Promise<Investigation>;
    getInvestigationById(id: number): Promise<Investigation>;
    getInvestigationReport(id: number): Promise<{
        alertId: string;
        investigationStatus: string;
        stages: InvestigationStage[];
        finalDecision: string;
        riskLevel: "LOW" | "MEDIUM" | "HIGH";
        confidenceScore: number;
        complianceNarrative: string;
        investigationId: number;
        status: InvestigationStatus;
        decision: import("../types").AiDecisionType | null;
        confidence: number | null;
        report: string | null;
        agentResults: {
            agent: import("../types").AgentType;
            result: Record<string, unknown>;
            timestamp: Date;
        }[];
    }>;
    createInvestigation({ alertId, managerId, notes, action }: CreateInvestigationInput): Promise<Investigation | null>;
    updateInvestigation(id: number, { notes, action }: {
        notes?: string;
        action?: InvestigationAction;
    }): Promise<Investigation | null>;
    getInvestigations(query: QueryFilters): Promise<{
        investigations: Investigation[];
        pagination: import("../types").PaginationMeta;
    }>;
}
declare const _default: InvestigationService;
export default _default;
//# sourceMappingURL=investigationService.d.ts.map