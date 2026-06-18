import { FunctionTool } from '@google/adk';
import { z } from 'zod';
import customerRepository from '../../repositories/customerRepository';
import { AppDataSource } from '../../config/database';
import { Account } from '../../models/Account';
import { Transaction } from '../../models/Transaction';
import highRiskCountryService from '../../services/highRiskCountryService';

interface OpenSanctionsMatchResult {
  matched: boolean;
  match_score: number;
  matched_lists: string[];
  entities: Array<{ name: string; datasets: string[]; score: number }>;
  source: 'opensanctions';
  entity_name: string;
  high_risk_country_transactions?: number;
  customer_country?: string;
}

async function matchOpenSanctions(entityName: string): Promise<OpenSanctionsMatchResult> {
  const response = await fetch('https://api.opensanctions.org/match/default?algorithm=best', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      queries: {
        q1: {
          schema: 'Person',
          properties: { name: [entityName] },
        },
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenSanctions API error ${response.status}: ${body.slice(0, 200)}`);
  }

  const apiResult = (await response.json()) as {
    responses?: {
      q1?: {
        results?: Array<{
          score?: number;
          match?: boolean;
          datasets?: string[];
          properties?: { name?: string[] };
        }>;
      };
    };
  };

  const results = apiResult.responses?.q1?.results ?? [];
  const matches = results
    .filter((r) => (r.score ?? 0) >= 0.7 || r.match)
    .map((r) => ({
      name: r.properties?.name?.[0] ?? entityName,
      datasets: r.datasets ?? [],
      score: r.score ?? 0,
    }));

  const matchedLists = [...new Set(matches.flatMap((m) => m.datasets))];

  return {
    matched: matches.length > 0,
    match_score: matches[0]?.score ?? 0,
    matched_lists: matchedLists,
    entities: matches,
    source: 'opensanctions',
    entity_name: entityName,
  };
}

async function getHighRiskCountryTxnCount(customerId: number): Promise<number> {
  const highRiskCountries = await highRiskCountryService.getCountries();
  const accounts = await AppDataSource.getRepository(Account).find({ where: { customer_id: customerId } });
  const accountIds = accounts.map((a) => a.id);
  if (!accountIds.length) return 0;

  const txns = await AppDataSource.getRepository(Transaction)
    .createQueryBuilder('t')
    .where('t.account_id IN (:...accountIds)', { accountIds })
    .getMany();

  return txns.filter(
    (t) =>
      t.country &&
      highRiskCountries.has(t.country.trim().toLowerCase())
  ).length;
}

export const opensanctionsTool = new FunctionTool({
  name: 'opensanctions_lookup',
  description:
    'Screen a person against live OpenSanctions watchlists (OFAC, UN, EU, PEP datasets). Returns real API matches only.',
  parameters: z.object({
    entity_name: z.string().describe('Full name of person or entity to screen'),
    check_type: z.enum(['sanctions', 'pep']).describe('sanctions = watchlists; pep = politically exposed persons'),
    customer_id: z.number().optional().describe('Customer ID for geographic risk context from bank DB'),
  }),
  execute: async ({ entity_name, check_type, customer_id }) => {
    const result = await matchOpenSanctions(entity_name);

    if (customer_id) {
      const customer = await customerRepository.findById(customer_id);
      const highRiskCountryTransactions = await getHighRiskCountryTxnCount(customer_id);
      return {
        ...result,
        check_type,
        customer_country: customer?.country ?? null,
        is_kyc_pep: customer?.is_pep ?? false,
        high_risk_country_transactions: highRiskCountryTransactions,
      };
    }

    return { ...result, check_type };
  },
});

export async function resolveCustomerName(customerId: number): Promise<string> {
  const customer = await customerRepository.findById(customerId);
  return customer?.name ?? 'Unknown';
}
