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

class DecisionAgent {
  synthesize(
    customer: CustomerAnalysisResult,
    transaction: TransactionAnalysisResult,
    sanctions: SanctionsCheckResult,
    pep: PepCheckResult,
    media: MediaAnalysisResult
  ): InvestigationSynthesis {
    const riskFactors: string[] = [];

    if (transaction.risk === 'High') riskFactors.push('High-value transaction anomaly');
    if (transaction.spikeMultiplier >= 5) riskFactors.push(`${transaction.spikeMultiplier}x spike vs average`);
    if (pep.pepMatch) riskFactors.push('PEP match');
    if (media.negativeNews) riskFactors.push(`${media.articleCount} adverse media articles`);
    if (media.searchStatus === 'failed' || media.source === 'unavailable') {
      riskFactors.push('Adverse media Google Search unavailable — manual review required');
    }
    if (sanctions.sanctionMatch) riskFactors.push('Sanctions list match');
    if (customer.customerRisk === 'High') riskFactors.push('High-risk customer profile');
    if (transaction.velocityPattern !== 'Normal') riskFactors.push(`Unusual velocity: ${transaction.velocityPattern}`);

    let overallRiskScore = 0;
    if (transaction.risk === 'High') overallRiskScore += 35;
    else if (transaction.risk === 'Medium') overallRiskScore += 20;
    if (pep.pepMatch) overallRiskScore += 25;
    if (media.negativeNews) overallRiskScore += Math.min(media.articleCount * 5, 20);
    if (sanctions.sanctionMatch) overallRiskScore += 40;
    if (customer.customerRisk === 'High') overallRiskScore += 15;
    if (media.searchStatus === 'failed' || media.source === 'unavailable') overallRiskScore += 10;
    overallRiskScore = Math.min(100, overallRiskScore);

    return {
      transactionRisk: transaction.risk,
      customerRisk: customer.customerRisk,
      pepMatch: pep.pepMatch,
      negativeMedia: media.negativeNews,
      sanctionMatch: sanctions.sanctionMatch,
      riskFactors,
      overallRiskScore,
      summary: `Combined analysis: ${riskFactors.length} risk factor(s) identified. Overall risk score: ${overallRiskScore}/100.`,
    };
  }

  decide(synthesis: InvestigationSynthesis): DecisionResult {
    const reasoning: string[] = [];
    let decision: AiDecisionType = 'CLEAR';
    let confidence = 70;

    if (synthesis.sanctionMatch) {
      decision = 'SAR';
      confidence = 95;
      reasoning.push('Direct sanctions match requires SAR filing');
    } else if (synthesis.overallRiskScore >= 70) {
      decision = 'SAR';
      confidence = Math.min(98, 75 + synthesis.riskFactors.length * 3);
      reasoning.push(`High overall risk score (${synthesis.overallRiskScore})`);
      if (synthesis.pepMatch) reasoning.push('PEP involvement elevates severity');
      if (synthesis.negativeMedia) reasoning.push('Adverse media corroborates suspicion');
    } else if (
      synthesis.overallRiskScore >= 40 ||
      synthesis.pepMatch ||
      synthesis.negativeMedia ||
      synthesis.riskFactors.some((f) => f.includes('Google Search unavailable'))
    ) {
      decision = 'ESCALATE';
      confidence = Math.min(92, 60 + synthesis.riskFactors.length * 5);
      reasoning.push('Multiple risk indicators warrant manual review');
      if (synthesis.pepMatch) reasoning.push('PEP match requires senior analyst review');
      if (synthesis.transactionRisk === 'High') reasoning.push('Transaction anomaly detected');
    } else {
      decision = 'CLEAR';
      confidence = Math.min(90, 80 + (100 - synthesis.overallRiskScore) / 5);
      reasoning.push('No significant risk indicators found');
      reasoning.push('Alert appears to be false positive');
    }

    return { decision, confidence: Math.round(confidence), reasoning };
  }
}

export default new DecisionAgent();
