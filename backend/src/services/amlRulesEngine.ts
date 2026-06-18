import config from '../config';
import { AppDataSource } from '../config/database';
import { Account } from '../models/Account';
import { Transaction } from '../models/Transaction';
import { Alert } from '../models/Alert';
import transactionRepository from '../repositories/transactionRepository';
import customerRepository from '../repositories/customerRepository';
import { calculateRiskCategory, calculateSeverity, capRiskScore } from '../utils/riskCalculator';
import alertGenerationService from './alertGenerationService';
import notificationService from './notificationService';
import { TriggeredRule } from '../types';
import highRiskCountryService from './highRiskCountryService';

const RULE_TYPES = {
  LARGE_TRANSACTION: 'Large Transaction',
  RAPID_TRANSACTIONS: 'Rapid Transactions',
  STRUCTURING: 'Structuring',
  HIGH_RISK_COUNTRY: 'High-Risk Country',
  SUDDEN_ACTIVITY_SPIKE: 'Sudden Activity Spike',
} as const;

class AmlRulesEngine {
  async evaluateTransaction(transaction: Transaction): Promise<Alert[]> {
    const account = await AppDataSource.getRepository(Account).findOne({
      where: { id: transaction.account_id },
    });
    if (!account) return [];

    const customer = await customerRepository.findById(account.customer_id);
    if (!customer) return [];

    const accountIds = (
      await AppDataSource.getRepository(Account).find({
        where: { customer_id: customer.id },
        select: ['id'],
      })
    ).map((a) => a.id);

    const triggeredRules: TriggeredRule[] = [];
    const transactionDate = new Date(transaction.transaction_date);
    const amount = parseFloat(String(transaction.amount));

    if (amount > config.aml.thresholds.largeTransaction) {
      triggeredRules.push({
        rule: RULE_TYPES.LARGE_TRANSACTION,
        riskIncrease: 30,
        transactionId: transaction.id,
      });
    }

    const rapidCount = await transactionRepository.countInTimeWindow(
      accountIds,
      config.aml.thresholds.rapidTransactionWindowHours,
      transactionDate
    );
    if (rapidCount > config.aml.thresholds.rapidTransactionCount) {
      triggeredRules.push({
        rule: RULE_TYPES.RAPID_TRANSACTIONS,
        riskIncrease: 20,
        transactionId: transaction.id,
      });
    }

    const structuringCount = await transactionRepository.countStructuringTransactions(
      accountIds,
      config.aml.thresholds.structuringAmount,
      config.aml.thresholds.structuringWindowHours,
      transactionDate
    );
    if (structuringCount > 1) {
      triggeredRules.push({
        rule: RULE_TYPES.STRUCTURING,
        riskIncrease: 25,
        transactionId: transaction.id,
      });
    }

    if (await highRiskCountryService.isHighRiskCountry(transaction.country)) {
      triggeredRules.push({
        rule: RULE_TYPES.HIGH_RISK_COUNTRY,
        riskIncrease: 40,
        transactionId: transaction.id,
      });
    }

    const currentMonth = transactionDate.getMonth() + 1;
    const currentYear = transactionDate.getFullYear();
    const currentMonthVolume = await transactionRepository.getMonthlyVolume(
      accountIds,
      currentYear,
      currentMonth
    );
    const avgMonthlyVolume = await transactionRepository.getAverageMonthlyVolume(accountIds, transactionDate);

    if (
      avgMonthlyVolume > 0 &&
      currentMonthVolume > avgMonthlyVolume * config.aml.thresholds.activitySpikeMultiplier
    ) {
      triggeredRules.push({
        rule: RULE_TYPES.SUDDEN_ACTIVITY_SPIKE,
        riskIncrease: 35,
        transactionId: transaction.id,
      });
    }

    if (triggeredRules.length === 0) return [];

    const totalRiskIncrease = triggeredRules.reduce((sum, r) => sum + r.riskIncrease, 0);
    const newScore = capRiskScore(customer.risk_score + totalRiskIncrease);
    const riskCategory = calculateRiskCategory(newScore);

    const updatedCustomer = await customerRepository.updateRiskScore(customer.id, newScore, riskCategory);
    if (!updatedCustomer) return [];

    const alerts: Alert[] = [];
    for (const rule of triggeredRules) {
      const alert = await alertGenerationService.createAlert({
        customerId: customer.id,
        transactionId: rule.transactionId,
        alertType: rule.rule,
        riskScore: newScore,
        severity: calculateSeverity(newScore),
      });
      alerts.push(alert);
      await notificationService.notifyNewAlert(alert, updatedCustomer);
    }

    if (riskCategory === 'High' && customer.risk_category !== 'High') {
      await notificationService.notifyHighRiskCustomer(updatedCustomer);
    }

    return alerts;
  }
}

export default new AmlRulesEngine();
