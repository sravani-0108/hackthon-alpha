import { FunctionTool } from '@google/adk';
import { z } from 'zod';
import customerAgent from '../../services/agents/customerAgent';

export const customerLookupTool = new FunctionTool({
  name: 'customer_lookup',
  description: 'Retrieve customer KYC profile, account age, balances, and risk classification from the bank database.',
  parameters: z.object({
    customer_id: z.number().describe('Internal customer ID'),
  }),
  execute: async ({ customer_id }) => customerAgent.analyze(customer_id),
});
