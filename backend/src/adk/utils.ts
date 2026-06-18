import { BaseAgent, InMemoryRunner, InMemorySessionService, Runner, isFinalResponse, stringifyContent } from '@google/adk';
import config from '../config';
import { amlWorkflow } from './workflows/amlWorkflow';

const APP_NAME = 'aml_shield';

export function ensureGeminiEnv(): void {
  if (!process.env.GEMINI_API_KEY && config.geminiApiKey) {
    process.env.GEMINI_API_KEY = config.geminiApiKey;
  }
}

export function isAdkEnabled(): boolean {
  return config.useAdk && Boolean(config.geminiApiKey);
}

export function getSystemMode() {
  return {
    llmEnabled: isAdkEnabled(),
    model: 'gemini-flash-latest',
    workflow: 'aml_triage_workflow',
    screeningMode: config.useMockScreening ? 'mock' : 'live',
    dataSources: config.useMockScreening
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

export async function runAdkAgent(agent: BaseAgent, userMessage: string): Promise<string> {
  ensureGeminiEnv();
  const runner = new InMemoryRunner({ agent, appName: APP_NAME });
  let finalText = '';

  for await (const event of runner.runEphemeral({
    userId: 'aml-system',
    newMessage: { role: 'user', parts: [{ text: userMessage }] },
  })) {
    if (isFinalResponse(event)) {
      finalText = stringifyContent(event);
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

export async function runAmlWorkflow(
  userMessage: string,
  stateDelta: Record<string, unknown> = {}
): Promise<Record<string, unknown>> {
  ensureGeminiEnv();
  const sessionService = new InMemorySessionService();
  const runner = new Runner({
    appName: APP_NAME,
    agent: amlWorkflow,
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

export function parseJsonFromLlm<T>(text: string, fallback: T): T {
  const raw = typeof text === 'string' ? text : JSON.stringify(text);
  const trimmed = raw.trim();
  const jsonMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, trimmed];
  const candidate = (jsonMatch[1] ?? trimmed).trim();

  try {
    return JSON.parse(candidate) as T;
  } catch {
    const start = candidate.indexOf('{');
    const end = candidate.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(candidate.slice(start, end + 1)) as T;
      } catch {
        return fallback;
      }
    }
    return fallback;
  }
}

export function parseStateValue<T>(value: unknown, fallback: T): T {
  if (value == null) return fallback;
  if (typeof value === 'object') return value as T;
  return parseJsonFromLlm(String(value), fallback);
}

export function buildAlertPrompt(context: Record<string, unknown>): string {
  return `Analyze this AML alert. Use your tools for live data (database, OpenSanctions, Google Search). Return only valid JSON per your instructions.

Alert context:
${JSON.stringify(context, null, 2)}`;
}

export function buildMediaSearchPrompt(context: Record<string, unknown>): string {
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
