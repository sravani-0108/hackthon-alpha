"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runAmlTriage = runAmlTriage;
exports.runSingleAdkAgent = runSingleAdkAgent;
const alertRepository_1 = __importDefault(require("../repositories/alertRepository"));
const customerAgent_1 = __importDefault(require("../services/agents/customerAgent"));
const transactionAgent_1 = __importDefault(require("../services/agents/transactionAgent"));
const decisionAgent_1 = __importDefault(require("../services/agents/decisionAgent"));
const utils_1 = require("./utils");
const googleSearchMedia_1 = require("./googleSearchMedia");
const config_1 = __importDefault(require("../config"));
const opensanctionsTool_1 = require("./tools/opensanctionsTool");
const profileAgent_1 = require("./agents/profileAgent");
const transactionAgent_2 = require("./agents/transactionAgent");
const pepAgent_1 = require("./agents/pepAgent");
const adverseMediaAgent_1 = require("./agents/adverseMediaAgent");
const sanctionsAgent_1 = require("./agents/sanctionsAgent");
const investigationAgent_1 = require("./agents/investigationAgent");
async function loadAlertContext(alertId) {
    const alert = await alertRepository_1.default.findById(alertId);
    if (!alert)
        throw Object.assign(new Error('Alert not found.'), { statusCode: 404 });
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
function emptySanctions() {
    return {
        sanctionMatch: false,
        matchedLists: [],
        checkedLists: ['OFAC', 'UN', 'EU', 'OpenSanctions'],
        highRiskCountryTransactions: 0,
        summary: 'No sanctions match from OpenSanctions.',
    };
}
function emptyPep() {
    return {
        pepMatch: false,
        pepDetails: null,
        checkedDatabases: ['OpenSanctions PEP'],
        isDirectPep: false,
        summary: 'No PEP match from OpenSanctions.',
    };
}
function emptyMedia(searchedName) {
    return {
        negativeNews: false,
        articleCount: 0,
        articles: [],
        summary: searchedName
            ? `No adverse media found via Google Search for "${searchedName}".`
            : 'No adverse media found via Google Search.',
    };
}
function normalizeCustomer(raw, customerId) {
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
function normalizeTransaction(raw, fallback) {
    return { ...fallback, ...raw, summary: raw.summary ?? fallback.summary };
}
function normalizeSanctions(raw, fallback) {
    return { ...fallback, ...raw, summary: raw.summary ?? fallback.summary };
}
function normalizePep(raw, fallback) {
    return {
        ...fallback,
        ...raw,
        pepMatch: raw.pepMatch ?? raw.is_pep ?? fallback.pepMatch,
        summary: raw.summary ?? fallback.summary,
    };
}
function normalizeMedia(raw, fallback) {
    const articles = raw.articles?.length
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
function mapInvestigationOutput(output, customer, transaction, sanctions, pep, media) {
    const ruleSynthesis = decisionAgent_1.default.synthesize(customer, transaction, sanctions, pep, media);
    const ruleDecision = decisionAgent_1.default.decide(ruleSynthesis);
    if (!output) {
        return { synthesis: ruleSynthesis, decision: ruleDecision };
    }
    const normalizedConfidence = typeof output.confidenceScore === 'number'
        ? output.confidenceScore <= 1
            ? output.confidenceScore
            : output.confidenceScore / 100
        : output.confidence ?? 0;
    const llmSynthesis = {
        transactionRisk: output.transactionRisk ?? transaction.risk,
        customerRisk: output.customerRisk ?? customer.customerRisk,
        pepMatch: output.pepMatch ?? pep.pepMatch,
        negativeMedia: output.negativeMedia ?? media.negativeNews,
        sanctionMatch: output.sanctionMatch ?? sanctions.sanctionMatch,
        riskFactors: output.riskFactors ??
            output.riskIndicators ??
            output.keyFindings ??
            output.risk_signals ??
            [],
        overallRiskScore: output.overall_risk_score ?? 0,
        summary: output.summary ??
            output.complianceNarrative?.slice(0, 200) ??
            output.narrative?.slice(0, 200) ??
            ruleSynthesis.summary,
    };
    const synthesis = {
        ...ruleSynthesis,
        overallRiskScore: Math.max(ruleSynthesis.overallRiskScore, llmSynthesis.overallRiskScore),
        riskFactors: [...new Set([...ruleSynthesis.riskFactors, ...llmSynthesis.riskFactors])],
        summary: llmSynthesis.summary.length > ruleSynthesis.summary.length ? llmSynthesis.summary : ruleSynthesis.summary,
    };
    const decision = decisionAgent_1.default.decide(synthesis);
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
async function runMediaScreening(customerName, context) {
    if (config_1.default.useMockScreening) {
        const mediaRaw = await (0, utils_1.runAdkAgent)(adverseMediaAgent_1.adverseMediaAgent, (0, utils_1.buildMediaSearchPrompt)(context));
        return normalizeMedia((0, utils_1.parseStateValue)(mediaRaw, emptyMedia(customerName)), emptyMedia(customerName));
    }
    return (0, googleSearchMedia_1.runGoogleSearchMedia)(customerName, context);
}
async function getDbBaselines(alertId, customerId) {
    const [customer, transaction] = await Promise.all([
        customerAgent_1.default.analyze(customerId),
        transactionAgent_1.default.analyze(alertId, customerId),
    ]);
    return { customer, transaction };
}
async function runAdkPipeline(alertId, context) {
    const customerName = await (0, opensanctionsTool_1.resolveCustomerName)(context.customerId);
    const promptContext = { ...context, customer_name: customerName, alert_id: String(alertId) };
    const prompt = (0, utils_1.buildAlertPrompt)(promptContext);
    console.log('[ADK] Running specialist agents (profile, sanctions, transaction, PEP)...');
    console.log(`[ADK] Media search target: "${customerName}"`);
    const baselines = await getDbBaselines(alertId, context.customerId);
    const [profileRaw, sanctionsRaw, transactionRaw, pepRaw] = await Promise.all([
        (0, utils_1.runAdkAgent)(profileAgent_1.profileAgent, prompt),
        (0, utils_1.runAdkAgent)(sanctionsAgent_1.sanctionsAgent, prompt),
        (0, utils_1.runAdkAgent)(transactionAgent_2.transactionAgent, prompt),
        (0, utils_1.runAdkAgent)(pepAgent_1.pepAgent, prompt),
    ]);
    const customer = normalizeCustomer((0, utils_1.parseStateValue)(profileRaw, baselines.customer), context.customerId);
    const transaction = normalizeTransaction((0, utils_1.parseStateValue)(transactionRaw, baselines.transaction), baselines.transaction);
    const sanctions = normalizeSanctions((0, utils_1.parseStateValue)(sanctionsRaw, emptySanctions()), emptySanctions());
    const pep = normalizePep((0, utils_1.parseStateValue)(pepRaw, emptyPep()), emptyPep());
    const media = await runMediaScreening(customerName, promptContext);
    console.log(`[ADK] Media result: negativeNews=${media.negativeNews}, articles=${media.articleCount}, summary=${media.summary.slice(0, 120)}`);
    const investigationPrompt = (0, utils_1.buildAlertPrompt)({
        ...promptContext,
        phase: 'investigation_synthesis',
        findings: { customer, transaction, sanctions, pep, media },
    });
    console.log('[ADK] Running investigation agent...');
    const investigationRaw = await (0, utils_1.runAdkAgent)(investigationAgent_1.investigationAgent, investigationPrompt);
    const investigationOutput = investigationRaw.trim()
        ? (0, utils_1.parseStateValue)(investigationRaw, null)
        : null;
    const { synthesis, decision } = mapInvestigationOutput(investigationOutput, customer, transaction, sanctions, pep, media);
    console.log(`[ADK] Decision: ${decision.decision} (score=${synthesis.overallRiskScore}, factors=${synthesis.riskFactors.length})`);
    return { customer, transaction, sanctions, pep, media, synthesis, decision };
}
async function runAmlTriage(alertId) {
    const context = await loadAlertContext(alertId);
    if (!(0, utils_1.isAdkEnabled)()) {
        throw Object.assign(new Error('GEMINI_API_KEY or GOOGLE_API_KEY is required. Add it to backend/.env and restart.'), { statusCode: 503 });
    }
    return runAdkPipeline(alertId, context);
}
async function runSingleAdkAgent(agentType, alertId) {
    if (!(0, utils_1.isAdkEnabled)()) {
        throw Object.assign(new Error('GEMINI_API_KEY or GOOGLE_API_KEY is required for ADK agents.'), { statusCode: 503 });
    }
    const context = await loadAlertContext(alertId);
    const customerName = await (0, opensanctionsTool_1.resolveCustomerName)(context.customerId);
    const promptContext = { ...context, customer_name: customerName };
    const prompt = (0, utils_1.buildAlertPrompt)(promptContext);
    const baselines = await getDbBaselines(alertId, context.customerId);
    if (agentType === 'media_analysis') {
        return runMediaScreening(customerName, promptContext);
    }
    const agentMap = {
        customer_analysis: profileAgent_1.profileAgent,
        transaction_analysis: transactionAgent_2.transactionAgent,
        sanctions_check: sanctionsAgent_1.sanctionsAgent,
        pep_check: pepAgent_1.pepAgent,
    };
    const raw = await (0, utils_1.runAdkAgent)(agentMap[agentType], prompt);
    switch (agentType) {
        case 'customer_analysis':
            return normalizeCustomer((0, utils_1.parseStateValue)(raw, baselines.customer), context.customerId);
        case 'transaction_analysis':
            return normalizeTransaction((0, utils_1.parseStateValue)(raw, baselines.transaction), baselines.transaction);
        case 'sanctions_check':
            return normalizeSanctions((0, utils_1.parseStateValue)(raw, emptySanctions()), emptySanctions());
        case 'pep_check':
            return normalizePep((0, utils_1.parseStateValue)(raw, emptyPep()), emptyPep());
    }
}
//# sourceMappingURL=runner.js.map