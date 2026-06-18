import { FunctionTool } from '@google/adk';
import { z } from 'zod';
import transactionAgent from '../../services/agents/transactionAgent';

export const transactionAnalysisTool = new FunctionTool({
  name: 'transaction_analysis',
  description:
    'Analyze the flagged transaction for velocity, spike multiplier, and recent transaction patterns from the bank database.',
  parameters: z.object({
    alert_id: z.number().describe('Alert ID'),
    customer_id: z.number().describe('Customer ID linked to the alert'),
  }),
  execute: async ({ alert_id, customer_id }) => transactionAgent.analyze(alert_id, customer_id),
});
