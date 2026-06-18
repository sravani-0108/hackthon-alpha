import { AiDecisionType } from '../types';
import { CustomerAnalysisResult } from '../services/agents/customerAgent';
import { TransactionAnalysisResult } from '../services/agents/transactionAgent';
import { SanctionsCheckResult } from '../services/agents/sanctionsAgent';
import { PepCheckResult } from '../services/agents/pepAgent';
import { MediaAnalysisResult } from '../services/agents/mediaAgent';
import { InvestigationSynthesis, DecisionResult } from '../services/agents/decisionAgent';

export interface AmlAlertContext {
  alertId: number;
  customerId: number;
  transactionId?: number | null;
  alertType?: string;
  reason?: string;
  severity?: string;
  amount?: number;
  currency?: string;
}

export interface InvestigationAgentOutput {
  // Legacy fields (kept for backwards compatibility)
  alert_id?: string;
  narrative?: string;
  disposition?: AiDecisionType;
  confidence?: number;
  risk_signals?: string[];
  overall_risk_score?: number;
  reasoning?: string[];
  routed_to_human?: boolean;

  // New AML investigation schema
  alertId?: string;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
  decision?: 'CLEAR' | 'ESCALATE' | 'FILE_SAR';
  confidenceScore?: number;
  externalRisk?: string;
  keyFindings?: string[];
  riskIndicators?: string[];
  recommendedActions?: string[];
  complianceNarrative?: string;

  transactionRisk?: string;
  customerRisk?: string;
  pepMatch?: boolean;
  negativeMedia?: boolean;
  sanctionMatch?: boolean;
  riskFactors?: string[];
  summary?: string;
}

export interface AdkPipelineResult {
  customer: CustomerAnalysisResult;
  transaction: TransactionAnalysisResult;
  sanctions: SanctionsCheckResult;
  pep: PepCheckResult;
  media: MediaAnalysisResult;
  synthesis: InvestigationSynthesis;
  decision: DecisionResult;
}

export type { CustomerAnalysisResult, TransactionAnalysisResult, SanctionsCheckResult, PepCheckResult, MediaAnalysisResult };
