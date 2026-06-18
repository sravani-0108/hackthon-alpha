"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureGeminiEnv = ensureGeminiEnv;
exports.isAdkEnabled = isAdkEnabled;
exports.getSystemMode = getSystemMode;
exports.runAdkAgent = runAdkAgent;
exports.runAmlWorkflow = runAmlWorkflow;
exports.parseJsonFromLlm = parseJsonFromLlm;
exports.parseStateValue = parseStateValue;
exports.buildAlertPrompt = buildAlertPrompt;
exports.buildMediaSearchPrompt = buildMediaSearchPrompt;
const adk_1 = require("@google/adk");
const config_1 = __importDefault(require("../config"));
const amlWorkflow_1 = require("./workflows/amlWorkflow");
const APP_NAME = 'aml_shield';
function ensureGeminiEnv() {
    if (!process.env.GEMINI_API_KEY && config_1.default.geminiApiKey) {
        process.env.GEMINI_API_KEY = config_1.default.geminiApiKey;
    }
}
function isAdkEnabled() {
    return config_1.default.useAdk && Boolean(config_1.default.geminiApiKey);
}
function getSystemMode() {
    return {
        llmEnabled: isAdkEnabled(),
        model: 'gemini-flash-latest',
        workflow: 'aml_triage_workflow',
        screeningMode: config_1.default.useMockScreening ? 'mock' : 'live',
        dataSources: config_1.default.useMockScreening
            ? { customer: 'postgresql', transactions: 'postgresql', screening: 'mock' }
            : {
                customer: 'postgresql',
                transactions: 'postgresql',
                sanctions: 'opensanctions.org',
                pep: 'opensanctions.org',
                adverseMedia: 'google_search',
            },
    };
}
async function runAdkAgent(agent, userMessage) {
    ensureGeminiEnv();
    const runner = new adk_1.InMemoryRunner({ agent, appName: APP_NAME });
    let finalText = '';
    for await (const event of runner.runEphemeral({
        userId: 'aml-system',
        newMessage: { role: 'user', parts: [{ text: userMessage }] },
    })) {
        if ((0, adk_1.isFinalResponse)(event)) {
            finalText = (0, adk_1.stringifyContent)(event);
        }
        if (event.errorCode || event.errorMessage) {
            console.warn(`[ADK] Agent error: ${event.errorCode ?? ''} ${event.errorMessage ?? ''}`);
        }
    }
    if (!finalText.trim()) {
        console.warn('[ADK] Agent returned empty response — check GOOGLE_API_KEY / GEMINI_API_KEY');
    }
    return finalText;
}
async function runAmlWorkflow(userMessage, stateDelta = {}) {
    ensureGeminiEnv();
    const sessionService = new adk_1.InMemorySessionService();
    const runner = new adk_1.Runner({
        appName: APP_NAME,
        agent: amlWorkflow_1.amlWorkflow,
        sessionService,
    });
    const session = await sessionService.createSession({
        appName: APP_NAME,
        userId: 'aml-system',
        state: stateDelta,
    });
    for await (const _event of runner.runAsync({
        userId: 'aml-system',
        sessionId: session.id,
        newMessage: { role: 'user', parts: [{ text: userMessage }] },
        stateDelta,
    })) {
        // Workflow drives all sub-agents sequentially/parallel
    }
    const finalSession = await sessionService.getSession({
        appName: APP_NAME,
        userId: 'aml-system',
        sessionId: session.id,
    });
    return finalSession?.state ?? {};
}
function parseJsonFromLlm(text, fallback) {
    const raw = typeof text === 'string' ? text : JSON.stringify(text);
    const trimmed = raw.trim();
    const jsonMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, trimmed];
    const candidate = (jsonMatch[1] ?? trimmed).trim();
    try {
        return JSON.parse(candidate);
    }
    catch {
        const start = candidate.indexOf('{');
        const end = candidate.lastIndexOf('}');
        if (start >= 0 && end > start) {
            try {
                return JSON.parse(candidate.slice(start, end + 1));
            }
            catch {
                return fallback;
            }
        }
        return fallback;
    }
}
function parseStateValue(value, fallback) {
    if (value == null)
        return fallback;
    if (typeof value === 'object')
        return value;
    return parseJsonFromLlm(String(value), fallback);
}
function buildAlertPrompt(context) {
    return `Analyze this AML alert. Use your tools for live data (database, OpenSanctions, Google Search). Return only valid JSON per your instructions.

Alert context:
${JSON.stringify(context, null, 2)}`;
}
function buildMediaSearchPrompt(context) {
    const name = context.customer_name ?? context.customerName ?? 'unknown';
    return `You are the adverse media screening agent. You MUST call the google_search tool before responding.

Step 1: Search Google for: "${name}" fraud
Step 2: Search Google for: "${name}" money laundering
Step 3: Summarise any negative news found.

Alert context:
${JSON.stringify(context, null, 2)}

Return ONLY valid JSON:
{
  "negativeNews": boolean,
  "articleCount": number,
  "articles": [{ "title": string, "source": string, "date": string }],
  "summary": string,
  "risk_signals": string[],
  "article_urls": string[],
  "sentiment_summary": string,
  "source": "google_search",
  "searched_name": "${name}"
}`;
}
//# sourceMappingURL=utils.js.map