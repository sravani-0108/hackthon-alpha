import { LlmAgent } from '@google/adk';
import { customerLookupTool } from '../tools/customerLookupTool';

export const profileAgent = new LlmAgent({
  name: 'profile_agent',
  model: 'gemini-flash-latest',
  outputKey: 'customer_analysis',
  instruction: `You are a customer due-diligence analyst.
Given an AML alert context with customer_id, use customer_lookup to retrieve KYC data.
Analyze account age, risk score, occupation, country, and PEP flag.
Return ONLY valid JSON matching this shape:
{
  "customerId": number,
  "customerName": string,
  "customerRisk": "Low" | "Medium" | "High",
  "country": string,
  "occupation": string,
  "accountAgeDays": number,
  "riskScore": number,
  "isPep": boolean,
  "accountCount": number,
  "totalBalance": number,
  "summary": string,
  "risk_signals": string[]
}`,
  tools: [customerLookupTool],
});
