import { CustomerAnalysisResult } from '../services/agents/customerAgent';
import { TransactionAnalysisResult } from '../services/agents/transactionAgent';
import { SanctionsCheckResult } from '../services/agents/sanctionsAgent';
import { PepCheckResult } from '../services/agents/pepAgent';
import { MediaAnalysisResult } from '../services/agents/mediaAgent';
import { AdkPipelineResult } from './types';
export declare function runAmlTriage(alertId: number): Promise<AdkPipelineResult>;
export declare function runSingleAdkAgent(agentType: 'customer_analysis' | 'transaction_analysis' | 'sanctions_check' | 'pep_check' | 'media_analysis', alertId: number): Promise<CustomerAnalysisResult | TransactionAnalysisResult | SanctionsCheckResult | PepCheckResult | MediaAnalysisResult>;
//# sourceMappingURL=runner.d.ts.map