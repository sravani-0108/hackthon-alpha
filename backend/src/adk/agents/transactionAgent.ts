import { LlmAgent } from '@google/adk';
import { transactionAnalysisTool } from '../tools/transactionAnalysisTool';

export const transactionAgent = new LlmAgent({
  name: 'transaction_agent',
  model: 'gemini-flash-latest',
  outputKey: 'transaction_analysis',
  instruction: `You are a transaction pattern analyst.
Use transaction_analysis with alert_id and customer_id from the alert context.
Analyze structuring patterns, velocity, spike multiplier, and geographic anomalies.
Return ONLY valid JSON:
{
  "usualMonthlyAverage": number,
  "currentTransfer": number,
  "transactionCount30Days": number,
  "velocityPattern": string,
  "spikeMultiplier": number,
  "risk": "Low" | "Medium" | "High",
  "triggerTransactionId": number | null,
  "triggerAccountNumber": string | null,
  "dataVerified": boolean,
  "recentTransactions": array,
  "summary": string,
  "risk_signals": string[]
}`,
  tools: [transactionAnalysisTool],
});
