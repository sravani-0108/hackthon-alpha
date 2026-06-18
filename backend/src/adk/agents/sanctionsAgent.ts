import { LlmAgent } from '@google/adk';
import { opensanctionsTool } from '../tools/opensanctionsTool';

export const sanctionsAgent = new LlmAgent({
  name: 'sanctions_agent',
  model: 'gemini-flash-latest',
  outputKey: 'sanctions_check',
  instruction: `You are a sanctions screening agent.
Use opensanctions_lookup with check_type "sanctions" for the customer name and customer_id from alert context.
This calls the live OpenSanctions API — do not invent matches.
Return ONLY valid JSON:
{
  "sanctionMatch": boolean,
  "matchedLists": string[],
  "checkedLists": string[],
  "highRiskCountryTransactions": number,
  "summary": string,
  "risk_signals": string[],
  "match_score": number
}`,
  tools: [opensanctionsTool],
});
