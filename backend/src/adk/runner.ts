import alertRepository from '../repositories/alertRepository';
import customerAgent from '../services/agents/customerAgent';
import transactionAgentLegacy from '../services/agents/transactionAgent';
import { CustomerAnalysisResult } from '../services/agents/customerAgent';
import { TransactionAnalysisResult } from '../services/agents/transactionAgent';
import { SanctionsCheckResult } from '../services/agents/sanctionsAgent';
import { PepCheckResult } from '../services/agents/pepAgent';
import { MediaAnalysisResult } from '../services/agents/mediaAgent';
import decisionAgent, { InvestigationSynthesis, DecisionResult } from '../services/agents/decisionAgent';
import { AmlAlertContext, AdkPipelineResult, InvestigationAgentOutput } from './types';
import {
  buildAlertPrompt,
  buildMediaSearchPrompt,
  isAdkEnabled,
  parseStateValue,
  runAdkAgent,
} from './utils';
import { runGoogleSearchMedia } from './googleSearchMedia';
import config from '../config';
import { resolveCustomerName } from './tools/opensanctionsTool';
import { profileAgent } from './agents/profileAgent';
import { transactionAgent } from './agents/transactionAgent';
import { pepAgent } from './agents/pepAgent';
import { adverseMediaAgent } from './agents/adverseMediaAgent';
import { sanctionsAgent } from './agents/sanctionsAgent';
import { investigationAgent } from './agents/investigationAgent';

async function loadAlertContext(alertId: number): Promise<AmlAlertContext> {
  const alert = await alertRepository.findById(alertId);
  if (!alert) throw Object.assign(new Error('Alert not found.'), { statusCode: 404 });

  return {
    alertId: alert.id,
    customerId: alert.customer_id,
    transactionId: alert.transaction_id,
    alertType: alert.alert_type,
    reason: alert.reason ?? undefined,
    severity: alert.severity,
    amount: alert.transaction ? parseFloat(String(alert.transaction.amount)) : undefined,
    currency: 'INR',
  };
}

function emptySanctions(): SanctionsCheckResult {
  return {
    sanctionMatch: false,
    matchedLists: [],
    checkedLists: ['OFAC', 'UN', 'EU', 'OpenSanctions'],
    highRiskCountryTransactions: 0,
    summary: 'No sanctions match from OpenSanctions.',
  };
}

function emptyPep(): PepCheckResult {
  return {
    pepMatch: false,
    pepDetails: null,
    checkedDatabases: ['OpenSanctions PEP'],
    isDirectPep: false,
    summary: 'No PEP match from OpenSanctions.',
  };
}

function emptyMedia(searchedName?: string): MediaAnalysisResult {
  return {
    negativeNews: false,
    articleCount: 0,
    articles: [],
    summary: searchedName
      ? `No adverse media found via Google Search for "${searchedName}".`
      : 'No adverse media found via Google Search.',
  };
}

function normalizeCustomer(raw: Partial<CustomerAnalysisResult>, customerId: number): CustomerAnalysisResult {
  return {
    customerId: raw.customerId ?? customerId,
    customerName: raw.customerName ?? 'Unknown',
    customerRisk: raw.customerRisk ?? 'Medium',
    country: raw.country ?? 'India',
    occupation: raw.occupation ?? 'Unknown',
    accountAgeDays: raw.accountAgeDays ?? 0,
    riskScore: raw.riskScore ?? 0,
    isPep: raw.isPep ?? false,
    accountCount: raw.accountCount ?? 0,
    totalBalance: raw.totalBalance ?? 0,
    summary: raw.summary ?? 'Customer profile analyzed from database.',
  };
}

function normalizeTransaction(raw: Partial<TransactionAnalysisResult>, fallback: TransactionAnalysisResult): TransactionAnalysisResult {
  return { ...fallback, ...raw, summary: raw.summary ?? fallback.summary };
}

function normalizeSanctions(raw: Partial<SanctionsCheckResult>, fallback: SanctionsCheckResult): SanctionsCheckResult {
  return { ...fallback, ...raw, summary: raw.summary ?? fallback.summary };
}

function normalizePep(raw: Partial<PepCheckResult> & { is_pep?: boolean }, fallback: PepCheckResult): PepCheckResult {
  return {
    ...fallback,
    ...raw,
    pepMatch: raw.pepMatch ?? raw.is_pep ?? fallback.pepMatch,
    summary: raw.summary ?? fallback.summary,
  };
}

function normalizeMedia(raw: Partial<MediaAnalysisResult> & { article_urls?: string[] }, fallback: MediaAnalysisResult): MediaAnalysisResult {
  const articles =
    raw.articles?.length
      ? raw.articles
      : (raw.article_urls ?? []).map((url) => ({
          title: url,
          source: 'Google Search',
          date: '',
        }));

  const articleCount = raw.articleCount ?? articles.length;
  const negativeNews = raw.negativeNews ?? articleCount > 0;

  return {
    ...fallback,
    ...raw,
    articles,
    articleCount,
    negativeNews,
    summary: raw.summary ?? fallback.summary,
  };
}

function mapInvestigationOutput(
  output: InvestigationAgentOutput | null,
  customer: CustomerAnalysisResult,
  transaction: TransactionAnalysisResult,
  sanctions: SanctionsCheckResult,
  pep: PepCheckResult,
  media: MediaAnalysisResult
): { synthesis: InvestigationSynthesis; decision: DecisionResult } {
  const ruleSynthesis = decisionAgent.synthesize(customer, transaction, sanctions, pep, media);
  const ruleDecision = decisionAgent.decide(ruleSynthesis);

  if (!output) {
    return { synthesis: ruleSynthesis, decision: ruleDecision };
  }

  const normalizedConfidence =
    typeof output.confidenceScore === 'number'
      ? output.confidenceScore <= 1
        ? output.confidenceScore
        : output.confidenceScore / 100
      : output.confidence ?? 0;

  const llmSynthesis: InvestigationSynthesis = {
    transactionRisk: output.transactionRisk ?? transaction.risk,
    customerRisk: output.customerRisk ?? customer.customerRisk,
    pepMatch: output.pepMatch ?? pep.pepMatch,
    negativeMedia: output.negativeMedia ?? media.negativeNews,
    sanctionMatch: output.sanctionMatch ?? sanctions.sanctionMatch,
    riskFactors:
      output.riskFactors ??
      output.riskIndicators ??
      output.keyFindings ??
      output.risk_signals ??
      [],
    overallRiskScore: output.overall_risk_score ?? 0,
    summary:
      output.summary ??
      output.complianceNarrative?.slice(0, 200) ??
      output.narrative?.slice(0, 200) ??
      ruleSynthesis.summary,
  };

  const synthesis: InvestigationSynthesis = {
    ...ruleSynthesis,
    overallRiskScore: Math.max(ruleSynthesis.overallRiskScore, llmSynthesis.overallRiskScore),
    riskFactors: [...new Set([...ruleSynthesis.riskFactors, ...llmSynthesis.riskFactors])],
    summary: llmSynthesis.summary.length > ruleSynthesis.summary.length ? llmSynthesis.summary : ruleSynthesis.summary,
  };

  const decision = decisionAgent.decide(synthesis);

  if (output.decision === 'FILE_SAR' && decision.decision !== 'SAR') {
    decision.decision = 'SAR';
    decision.confidence = Math.max(decision.confidence, 95);
    decision.reasoning.push('Investigation model recommended FILE_SAR.');
  }

  if (sanctions.sanctionMatch && decision.decision !== 'SAR') {
    decision.decision = 'SAR';
    decision.confidence = Math.max(decision.confidence, 95);
    decision.reasoning.push('Sanctions match requires SAR filing.');
  }

  const severityRank = { CLEAR: 0, ESCALATE: 1, SAR: 2 };
  if (severityRank[ruleDecision.decision] > severityRank[decision.decision]) {
    decision.decision = ruleDecision.decision;
    decision.confidence = Math.max(decision.confidence, ruleDecision.confidence);
    decision.reasoning = [...new Set([...ruleDecision.reasoning, ...decision.reasoning])];
  }

  if (normalizedConfidence < 0.65 && decision.decision === 'CLEAR') {
    decision.decision = 'ESCALATE';
    decision.reasoning.push('Confidence below 0.65 threshold — routed to human analyst.');
  }

  return { synthesis, decision };
}

async function runMediaScreening(
  customerName: string,
  context: Record<string, unknown>
): Promise<MediaAnalysisResult> {
  if (config.useMockScreening) {
    const mediaRaw = await runAdkAgent(adverseMediaAgent, buildMediaSearchPrompt(context));
    return normalizeMedia(parseStateValue(mediaRaw, emptyMedia(customerName)), emptyMedia(customerName));
  }

  return runGoogleSearchMedia(customerName, context);
}

async function getDbBaselines(alertId: number, customerId: number) {
  const [customer, transaction] = await Promise.all([
    customerAgent.analyze(customerId),
    transactionAgentLegacy.analyze(alertId, customerId),
  ]);
  return { customer, transaction };
}

async function runAdkPipeline(alertId: number, context: AmlAlertContext): Promise<AdkPipelineResult> {
  const customerName = await resolveCustomerName(context.customerId);
  const promptContext = { ...context, customer_name: customerName, alert_id: String(alertId) };
  const prompt = buildAlertPrompt(promptContext);

  console.log('[ADK] Running specialist agents (profile, sanctions, transaction, PEP)...');
  console.log(`[ADK] Media search target: "${customerName}"`);

  const baselines = await getDbBaselines(alertId, context.customerId);

  const [profileRaw, sanctionsRaw, transactionRaw, pepRaw] = await Promise.all([
    runAdkAgent(profileAgent, prompt),
    runAdkAgent(sanctionsAgent, prompt),
    runAdkAgent(transactionAgent, prompt),
    runAdkAgent(pepAgent, prompt),
  ]);

  const customer = normalizeCustomer(
    parseStateValue(profileRaw, baselines.customer),
    context.customerId
  );
  const transaction = normalizeTransaction(
    parseStateValue(transactionRaw, baselines.transaction),
    baselines.transaction
  );
  const sanctions = normalizeSanctions(parseStateValue(sanctionsRaw, emptySanctions()), emptySanctions());
  const pep = normalizePep(parseStateValue(pepRaw, emptyPep()), emptyPep());

  const media = await runMediaScreening(customerName, promptContext);

  console.log(
    `[ADK] Media result: negativeNews=${media.negativeNews}, articles=${media.articleCount}, summary=${media.summary.slice(0, 120)}`
  );

  const investigationPrompt = buildAlertPrompt({
    ...promptContext,
    phase: 'investigation_synthesis',
    findings: { customer, transaction, sanctions, pep, media },
  });

  console.log('[ADK] Running investigation agent...');
  const investigationRaw = await runAdkAgent(investigationAgent, investigationPrompt);

  const investigationOutput = investigationRaw.trim()
    ? parseStateValue<InvestigationAgentOutput | null>(investigationRaw, null)
    : null;

  const { synthesis, decision } = mapInvestigationOutput(
    investigationOutput,
    customer,
    transaction,
    sanctions,
    pep,
    media
  );

  console.log(
    `[ADK] Decision: ${decision.decision} (score=${synthesis.overallRiskScore}, factors=${synthesis.riskFactors.length})`
  );

  return { customer, transaction, sanctions, pep, media, synthesis, decision };
}

export async function runAmlTriage(alertId: number): Promise<AdkPipelineResult> {
  const context = await loadAlertContext(alertId);

  if (!isAdkEnabled()) {
    throw Object.assign(
      new Error('GEMINI_API_KEY or GOOGLE_API_KEY is required. Add it to backend/.env and restart.'),
      { statusCode: 503 }
    );
  }

  return runAdkPipeline(alertId, context);
}

export async function runSingleAdkAgent(
  agentType: 'customer_analysis' | 'transaction_analysis' | 'sanctions_check' | 'pep_check' | 'media_analysis',
  alertId: number
) {
  if (!isAdkEnabled()) {
    throw Object.assign(
      new Error('GEMINI_API_KEY or GOOGLE_API_KEY is required for ADK agents.'),
      { statusCode: 503 }
    );
  }

  const context = await loadAlertContext(alertId);
  const customerName = await resolveCustomerName(context.customerId);
  const promptContext = { ...context, customer_name: customerName };
  const prompt = buildAlertPrompt(promptContext);

  const baselines = await getDbBaselines(alertId, context.customerId);

  if (agentType === 'media_analysis') {
    return runMediaScreening(customerName, promptContext);
  }

  const agentMap = {
    customer_analysis: profileAgent,
    transaction_analysis: transactionAgent,
    sanctions_check: sanctionsAgent,
    pep_check: pepAgent,
  };

  const raw = await runAdkAgent(agentMap[agentType], prompt);

  switch (agentType) {
    case 'customer_analysis':
      return normalizeCustomer(parseStateValue(raw, baselines.customer), context.customerId);
    case 'transaction_analysis':
      return normalizeTransaction(parseStateValue(raw, baselines.transaction), baselines.transaction);
    case 'sanctions_check':
      return normalizeSanctions(parseStateValue(raw, emptySanctions()), emptySanctions());
    case 'pep_check':
      return normalizePep(parseStateValue(raw, emptyPep()), emptyPep());
  }
}
