import customerRepository from '../../repositories/customerRepository';

const PEP_DATABASE = [
  { name: 'Vikram Singh', position: 'State Minister', country: 'India', source: 'World-Check' },
  { name: 'Rajesh Kumar', position: 'Municipal Councilor', country: 'India', source: 'Internal PEP List' },
  { name: 'Mohammed Ali', position: 'Business Associate of PEP', country: 'India', source: 'Dow Jones' },
];

export interface PepCheckResult {
  pepMatch: boolean;
  pepDetails: { name: string; position: string; source: string } | null;
  checkedDatabases: string[];
  isDirectPep: boolean;
  summary: string;
}

class PepAgent {
  async check(customerId: number): Promise<PepCheckResult> {
    const customer = await customerRepository.findById(customerId);
    if (!customer) throw new Error('Customer not found');

    const dbMatch = PEP_DATABASE.find(
      (p) => p.name.toLowerCase() === customer.name.toLowerCase()
    );

    const pepMatch = customer.is_pep || !!dbMatch;

    return {
      pepMatch,
      pepDetails: dbMatch
        ? { name: dbMatch.name, position: dbMatch.position, source: dbMatch.source }
        : customer.is_pep
          ? { name: customer.name, position: 'Flagged in KYC', source: 'Internal PEP List' }
          : null,
      checkedDatabases: ['World-Check', 'Dow Jones', 'Internal PEP List'],
      isDirectPep: customer.is_pep,
      summary: pepMatch
        ? `PEP match found${dbMatch ? `: ${dbMatch.position} (${dbMatch.source})` : ' via KYC flag'}.`
        : 'No PEP match found across all databases.',
    };
  }
}

export default new PepAgent();
