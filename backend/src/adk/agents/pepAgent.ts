import { LlmAgent } from '@google/adk';
import { opensanctionsTool } from '../tools/opensanctionsTool';

export const pepAgent = new LlmAgent({
  name: 'pep_agent',
  model: 'gemini-flash-latest',
  outputKey: 'pep_check',
  instruction: `You are a PEP screening agent.
Use opensanctions_lookup with check_type "pep" for the customer name and customer_id.
This calls the live OpenSanctions API — do not invent PEP matches.
Return ONLY valid JSON compatible with:
{
  "pepMatch": boolean,
  "pepDetails": { "name": string, "position": string, "source": string } | null,
  "checkedDatabases": string[],
  "isDirectPep": boolean,
  "summary": string,
  "risk_signals": string[],
  "is_pep": boolean,
  "pep_category": string | null
}`,
  tools: [opensanctionsTool],
});
