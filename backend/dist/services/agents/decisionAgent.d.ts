import { AiDecisionType } from '../../types';
import { CustomerAnalysisResult } from './customerAgent';
import { TransactionAnalysisResult } from './transactionAgent';
import { SanctionsCheckResult } from './sanctionsAgent';
import { PepCheckResult } from './pepAgent';
import { MediaAnalysisResult } from './mediaAgent';
export interface InvestigationSynthesis {
    transactionRisk: string;
    customerRisk: string;
    pepMatch: boolean;
    negativeMedia: boolean;
    sanctionMatch: boolean;
    riskFactors: string[];
    overallRiskScore: number;
    summary: string;
}
export interface DecisionResult {
    decision: AiDecisionType;
    confidence: number;
    reasoning: string[];
}
declare class DecisionAgent {
    synthesize(customer: CustomerAnalysisResult, transaction: TransactionAnalysisResult, sanctions: SanctionsCheckResult, pep: PepCheckResult, media: MediaAnalysisResult): InvestigationSynthesis;
    decide(synthesis: InvestigationSynthesis): DecisionResult;
}
declare const _default: DecisionAgent;
export default _default;
//# sourceMappingURL=decisionAgent.d.ts.map