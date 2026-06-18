import { AppDataSource } from '../../config/database';
import { Account } from '../../models/Account';
import { Transaction } from '../../models/Transaction';
import alertRepository from '../../repositories/alertRepository';
import transactionRepository from '../../repositories/transactionRepository';

export interface TransactionAnalysisResult {
  usualMonthlyAverage: number;
  currentTransfer: number;
  transactionCount30Days: number;
  velocityPattern: string;
  spikeMultiplier: number;
  risk: string;
  triggerTransactionId: number | null;
  triggerAccountNumber: string | null;
  dataVerified: boolean;
  recentTransactions: Array<{ amount: number; type: string; date: string; country: string | null }>;
  summary: string;
}

class TransactionAgent {
  async analyze(alertId: number, customerId: number): Promise<TransactionAnalysisResult> {
    const alert = await alertRepository.findById(alertId);
    const accounts = await AppDataSource.getRepository(Account).find({
      where: { customer_id: customerId },
    });
    const accountIds = accounts.map((a) => a.id);
    const accountNumbers = new Set(accounts.map((a) => a.account_number));

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const recentTxns = accountIds.length
      ? await AppDataSource.getRepository(Transaction)
          .createQueryBuilder('t')
          .where('t.account_id IN (:...accountIds)', { accountIds })
          .andWhere('t.transaction_date >= :since', { since: thirtyDaysAgo })
          .orderBy('t.transaction_date', 'DESC')
          .take(20)
          .getMany()
      : [];

    let triggerTxn: Transaction | null = null;
    let dataVerified = false;

    if (alert?.transaction_id) {
      triggerTxn = await AppDataSource.getRepository(Transaction).findOne({
        where: { id: alert.transaction_id },
        relations: ['account'],
      });
      if (triggerTxn) {
        dataVerified = accountIds.includes(triggerTxn.account_id);
      }
    }

    const referenceDate = triggerTxn ? new Date(triggerTxn.transaction_date) : now;
    const excludeId = triggerTxn?.id;

    const avgMonthly = accountIds.length
      ? await transactionRepository.getAverageMonthlyVolume(accountIds, referenceDate, excludeId)
      : 0;

    const currentTransfer = triggerTxn ? parseFloat(String(triggerTxn.amount)) : 0;

    const spikeMultiplier =
      avgMonthly > 0 ? Math.round((currentTransfer / avgMonthly) * 100) / 100 : currentTransfer > 0 ? 999 : 0;

    let velocityPattern = 'Normal';
    if (recentTxns.length > 15) velocityPattern = 'High Frequency';
    else if (recentTxns.length > 8) velocityPattern = 'Elevated';

    let risk = 'Low';
    if (spikeMultiplier >= 10 || currentTransfer >= 2000000) risk = 'High';
    else if (spikeMultiplier >= 3 || currentTransfer >= 500000) risk = 'Medium';

    const triggerAccountNumber = triggerTxn?.account?.account_number ?? null;

    let summary = `Alert transaction of ₹${currentTransfer.toLocaleString('en-IN')} on account ${triggerAccountNumber || 'N/A'} is ${spikeMultiplier}x the customer's historical monthly average of ₹${Math.round(avgMonthly).toLocaleString('en-IN')}. Velocity: ${velocityPattern}.`;

    if (!dataVerified && triggerTxn) {
      summary += ' Warning: trigger transaction account does not match customer accounts.';
    }
    if (!triggerTxn) {
      summary = 'No linked alert transaction found. Analysis based on recent activity only.';
    }

    return {
      usualMonthlyAverage: Math.round(avgMonthly),
      currentTransfer,
      transactionCount30Days: recentTxns.length,
      velocityPattern,
      spikeMultiplier,
      risk,
      triggerTransactionId: triggerTxn?.id ?? null,
      triggerAccountNumber,
      dataVerified,
      recentTransactions: recentTxns.slice(0, 5).map((t) => ({
        amount: parseFloat(String(t.amount)),
        type: t.transaction_type,
        date: new Date(t.transaction_date).toISOString(),
        country: t.country,
      })),
      summary,
    };
  }
}

export default new TransactionAgent();
