import customerRepository from '../../repositories/customerRepository';
import { AppDataSource } from '../../config/database';
import { Account } from '../../models/Account';

export interface CustomerAnalysisResult {
  customerId: number;
  customerName: string;
  customerRisk: string;
  country: string;
  occupation: string;
  accountAgeDays: number;
  riskScore: number;
  isPep: boolean;
  accountCount: number;
  totalBalance: number;
  summary: string;
}

class CustomerAgent {
  async analyze(customerId: number): Promise<CustomerAnalysisResult> {
    const customer = await customerRepository.findById(customerId);
    if (!customer) throw new Error('Customer not found');

    const accounts = await AppDataSource.getRepository(Account).find({
      where: { customer_id: customerId },
    });

    const oldestAccount = accounts.reduce(
      (oldest, acc) => {
        const opened = acc.opened_at ? new Date(acc.opened_at) : new Date();
        return !oldest || opened < oldest ? opened : oldest;
      },
      null as Date | null
    );

    const accountAgeDays = oldestAccount
      ? Math.floor((Date.now() - oldestAccount.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    const totalBalance = accounts.reduce((sum, a) => sum + parseFloat(String(a.balance)), 0);

    return {
      customerId: customer.id,
      customerName: customer.name,
      customerRisk: customer.risk_category,
      country: customer.country || 'India',
      occupation: customer.occupation || 'Unknown',
      accountAgeDays,
      riskScore: customer.risk_score,
      isPep: customer.is_pep,
      accountCount: accounts.length,
      totalBalance,
      summary: `Customer ${customer.name} (${customer.customer_number}) has ${customer.risk_category} risk profile, based in ${customer.country || 'India'}, occupation: ${customer.occupation || 'Unknown'}. Account age: ${accountAgeDays} days.`,
    };
  }
}

export default new CustomerAgent();
