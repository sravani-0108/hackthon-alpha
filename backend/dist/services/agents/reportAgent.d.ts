import { CustomerAnalysisResult } from './customerAgent';
import { TransactionAnalysisResult } from './transactionAgent';
import { InvestigationSynthesis } from './decisionAgent';
import { DecisionResult } from './decisionAgent';
import { PepCheckResult } from './pepAgent';
import { MediaAnalysisResult } from './mediaAgent';
declare class ReportAgent {
    generate(customer: CustomerAnalysisResult, transaction: TransactionAnalysisResult, synthesis: InvestigationSynthesis, decision: DecisionResult, pep: PepCheckResult, media: MediaAnalysisResult): string;
    generateSarNarrative(customer: CustomerAnalysisResult, transaction: TransactionAnalysisResult, synthesis: InvestigationSynthesis): string;
}
declare const _default: ReportAgent;
export default _default;
//# sourceMappingURL=reportAgent.d.ts.map