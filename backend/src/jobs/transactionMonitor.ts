import { AppDataSource } from '../config/database';
import { Transaction } from '../models/Transaction';
import amlRulesEngine from '../services/amlRulesEngine';

export const processPendingTransactions = async () => {
  const repo = AppDataSource.getRepository(Transaction);

  const pendingTransactions = await repo.find({
    where: { status: 'Pending' },
    relations: ['account'],
    take: 100,
  });

  const results = [];
  for (const transaction of pendingTransactions) {
    transaction.status = 'Completed';
    await repo.save(transaction);
    const alerts = await amlRulesEngine.evaluateTransaction(transaction);
    results.push({ transactionId: transaction.id, alertsGenerated: alerts.length });
  }

  return results;
};
