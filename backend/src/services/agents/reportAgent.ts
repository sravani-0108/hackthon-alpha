import { AiDecisionType } from '../../types';
import { CustomerAnalysisResult } from './customerAgent';
import { TransactionAnalysisResult } from './transactionAgent';
import { InvestigationSynthesis } from './decisionAgent';
import { DecisionResult } from './decisionAgent';
import { PepCheckResult } from './pepAgent';
import { MediaAnalysisResult } from './mediaAgent';

class ReportAgent {
  generate(
    customer: CustomerAnalysisResult,
    transaction: TransactionAnalysisResult,
    synthesis: InvestigationSynthesis,
    decision: DecisionResult,
    pep: PepCheckResult,
    media: MediaAnalysisResult
  ): string {
    const lines = [
      '=== AML INVESTIGATION REPORT ===',
      '',
      `Customer: ${customer.customerName} (ID: ${customer.customerId})`,
      `Country: ${customer.country} | Occupation: ${customer.occupation}`,
      `Customer Risk Profile: ${customer.customerRisk} (Score: ${customer.riskScore})`,
      '',
      '--- Transaction Analysis ---',
      transaction.summary,
      `30-day transaction count: ${transaction.transactionCount30Days}`,
      '',
      '--- Screening Results ---',
      pep.summary,
      media.summary,
      '',
      '--- Risk Assessment ---',
      synthesis.summary,
      `Risk Factors: ${synthesis.riskFactors.join('; ') || 'None'}`,
      '',
      '--- AI Recommendation ---',
      `Decision: ${decision.decision}`,
      `Confidence: ${decision.confidence}%`,
      `Reasoning: ${decision.reasoning.join('. ')}.`,
      '',
      decision.decision === 'CLEAR'
        ? 'RECOMMENDATION: Clear alert — insufficient evidence of suspicious activity.'
        : decision.decision === 'ESCALATE'
          ? 'RECOMMENDATION: Escalate for manual review by senior AML analyst.'
          : 'RECOMMENDATION: File Suspicious Activity Report (SAR) immediately.',
      '',
      `Report generated: ${new Date().toISOString()}`,
    ];

    return lines.join('\n');
  }

  generateSarNarrative(
    customer: CustomerAnalysisResult,
    transaction: TransactionAnalysisResult,
    synthesis: InvestigationSynthesis
  ): string {
    return [
      `Suspicious Activity Report for customer ${customer.customerName}.`,
      `On review, a transfer of ₹${transaction.currentTransfer.toLocaleString('en-IN')} was identified,`,
      `representing a ${transaction.spikeMultiplier}x deviation from the customer's usual monthly average of ₹${transaction.usualMonthlyAverage.toLocaleString('en-IN')}.`,
      synthesis.pepMatch ? 'Customer matched PEP database.' : '',
      synthesis.negativeMedia ? 'Adverse media articles were identified.' : '',
      synthesis.sanctionMatch ? 'Sanctions screening returned positive match.' : '',
      `Overall risk score: ${synthesis.overallRiskScore}/100.`,
      'Based on automated and manual review, filing SAR is recommended.',
    ]
      .filter(Boolean)
      .join(' ');
  }
}

export default new ReportAgent();
