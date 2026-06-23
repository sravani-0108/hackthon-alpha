import { Case } from '../models/Case';
import { SarReport } from '../models/SarReport';
export type ManualCaseDecision = 'CLEAR' | 'SAR';
declare class CaseService {
    private generateCaseNumber;
    private generateSarNumber;
    createFromInvestigation(investigationId: number, alertId: number, customerId: number, priority: Case['priority'], summary: string): Promise<Case>;
    getCases(query: {
        page?: string;
        limit?: string;
        status?: string;
        includeClosed?: string;
    }): Promise<{
        cases: Case[];
        pagination: import("../types").PaginationMeta;
    }>;
    getCaseById(id: number): Promise<Case>;
    assignCase(id: number, userId: number): Promise<Case>;
    closeCase(id: number): Promise<Case>;
    resolveCase(id: number, decision: ManualCaseDecision, managerId: number, notes?: string): Promise<Case>;
    createSarReport(caseId: number, investigationId: number, customerId: number, narrative: string, filedBy?: number): Promise<SarReport>;
}
declare const _default: CaseService;
export default _default;
//# sourceMappingURL=caseService.d.ts.map