import config from '../../config';
import customerRepository from '../../repositories/customerRepository';
import { AppDataSource } from '../../config/database';
import { Transaction } from '../../models/Transaction';
import { Account } from '../../models/Account';
import highRiskCountryService from '../highRiskCountryService';

const SANCTIONS_ENTRIES = [
  { name: 'Mohammed Ali Hassan', list: 'OFAC', country: 'Syria' },
  { name: 'Global Trade Corp', list: 'UN', country: 'North Korea' },
  { name: 'Eastern Holdings Ltd', list: 'EU', country: 'Iran' },
  { name: 'Blackstone Trading', list: 'Internal Watchlist', country: 'Afghanistan' },
];

export interface SanctionsCheckResult {
  sanctionMatch: boolean;
  matchedLists: string[];
  checkedLists: string[];
  highRiskCountryTransactions: number;
  summary: string;
}

class SanctionsAgent {
  async check(customerId: number): Promise<SanctionsCheckResult> {
    const customer = await customerRepository.findById(customerId);
    if (!customer) throw new Error('Customer not found');
    const highRiskCountries = await highRiskCountryService.getCountries();

    const nameMatch = SANCTIONS_ENTRIES.some(
      (entry) => entry.name.toLowerCase() === customer.name.toLowerCase()
    );

    const accounts = await AppDataSource.getRepository(Account).find({
      where: { customer_id: customerId },
    });
    const accountIds = accounts.map((a) => a.id);

    let highRiskCountryTransactions = 0;
    if (accountIds.length) {
      const txns = await AppDataSource.getRepository(Transaction)
        .createQueryBuilder('t')
        .where('t.account_id IN (:...accountIds)', { accountIds })
        .getMany();

      highRiskCountryTransactions = txns.filter(
        (t) =>
          t.country &&
          highRiskCountries.has(t.country.trim().toLowerCase())
      ).length;
    }

    const countryMatch = customer.country
      ? highRiskCountries.has(customer.country.trim().toLowerCase())
      : false;

    const matchedLists: string[] = [];
    if (nameMatch) {
      const entry = SANCTIONS_ENTRIES.find((e) => e.name.toLowerCase() === customer.name.toLowerCase());
      if (entry) matchedLists.push(entry.list);
    }
    if (countryMatch) matchedLists.push('Country Risk List');
    if (highRiskCountryTransactions > 0) matchedLists.push('High-Risk Transaction Geography');

    const sanctionMatch = nameMatch || highRiskCountryTransactions > 0;

    return {
      sanctionMatch,
      matchedLists,
      checkedLists: config.aml.sanctionsList,
      highRiskCountryTransactions,
      summary: sanctionMatch
        ? `Sanctions concern detected. Matches: ${matchedLists.join(', ')}.`
        : `No direct sanctions match found across ${config.aml.sanctionsList.join(', ')}.`,
    };
  }
}

export default new SanctionsAgent();
