import { FunctionTool } from '@google/adk';
import { z } from 'zod';
import customerRepository from '../../repositories/customerRepository';

/** Only registered when USE_MOCK_SCREENING=true — live mode uses GOOGLE_SEARCH only. */
export const adverseMediaTool = new FunctionTool({
  name: 'adverse_media_lookup',
  description: 'Offline mock adverse media lookup (demo mode only).',
  parameters: z.object({
    customer_id: z.number().describe('Customer ID'),
  }),
  execute: async ({ customer_id }) => {
    const customer = await customerRepository.findById(customer_id);
    if (!customer) throw new Error('Customer not found');
    return {
      negativeNews: false,
      articleCount: 0,
      articles: [],
      summary: `Mock mode: no seeded adverse media for ${customer.name}. Use live Google Search instead.`,
      source: 'mock',
    };
  },
});
