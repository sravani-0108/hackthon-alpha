"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = __importDefault(require("../config"));
const database_1 = require("../config/database");
const Account_1 = require("../models/Account");
const transactionRepository_1 = __importDefault(require("../repositories/transactionRepository"));
const customerRepository_1 = __importDefault(require("../repositories/customerRepository"));
const riskCalculator_1 = require("../utils/riskCalculator");
const alertGenerationService_1 = __importDefault(require("./alertGenerationService"));
const notificationService_1 = __importDefault(require("./notificationService"));
const highRiskCountryService_1 = __importDefault(require("./highRiskCountryService"));
const RULE_TYPES = {
    LARGE_TRANSACTION: 'Large Transaction',
    RAPID_TRANSACTIONS: 'Rapid Transactions',
    STRUCTURING: 'Structuring',
    HIGH_RISK_COUNTRY: 'High-Risk Country',
    SUDDEN_ACTIVITY_SPIKE: 'Sudden Activity Spike',
};
class AmlRulesEngine {
    async evaluateTransaction(transaction) {
        const account = await database_1.AppDataSource.getRepository(Account_1.Account).findOne({
            where: { id: transaction.account_id },
        });
        if (!account)
            return [];
        const customer = await customerRepository_1.default.findById(account.customer_id);
        if (!customer)
            return [];
        const accountIds = (await database_1.AppDataSource.getRepository(Account_1.Account).find({
            where: { customer_id: customer.id },
            select: ['id'],
        })).map((a) => a.id);
        const triggeredRules = [];
        const transactionDate = new Date(transaction.transaction_date);
        const amount = parseFloat(String(transaction.amount));
        if (amount > config_1.default.aml.thresholds.largeTransaction) {
            triggeredRules.push({
                rule: RULE_TYPES.LARGE_TRANSACTION,
                riskIncrease: 30,
                transactionId: transaction.id,
            });
        }
        const rapidCount = await transactionRepository_1.default.countInTimeWindow(accountIds, config_1.default.aml.thresholds.rapidTransactionWindowHours, transactionDate);
        if (rapidCount > config_1.default.aml.thresholds.rapidTransactionCount) {
            triggeredRules.push({
                rule: RULE_TYPES.RAPID_TRANSACTIONS,
                riskIncrease: 20,
                transactionId: transaction.id,
            });
        }
        const structuringCount = await transactionRepository_1.default.countStructuringTransactions(accountIds, config_1.default.aml.thresholds.structuringAmount, config_1.default.aml.thresholds.structuringWindowHours, transactionDate);
        if (structuringCount > 1) {
            triggeredRules.push({
                rule: RULE_TYPES.STRUCTURING,
                riskIncrease: 25,
                transactionId: transaction.id,
            });
        }
        if (await highRiskCountryService_1.default.isHighRiskCountry(transaction.country)) {
            triggeredRules.push({
                rule: RULE_TYPES.HIGH_RISK_COUNTRY,
                riskIncrease: 40,
                transactionId: transaction.id,
            });
        }
        const currentMonth = transactionDate.getMonth() + 1;
        const currentYear = transactionDate.getFullYear();
        const currentMonthVolume = await transactionRepository_1.default.getMonthlyVolume(accountIds, currentYear, currentMonth);
        const avgMonthlyVolume = await transactionRepository_1.default.getAverageMonthlyVolume(accountIds, transactionDate);
        if (avgMonthlyVolume > 0 &&
            currentMonthVolume > avgMonthlyVolume * config_1.default.aml.thresholds.activitySpikeMultiplier) {
            triggeredRules.push({
                rule: RULE_TYPES.SUDDEN_ACTIVITY_SPIKE,
                riskIncrease: 35,
                transactionId: transaction.id,
            });
        }
        if (triggeredRules.length === 0)
            return [];
        const totalRiskIncrease = triggeredRules.reduce((sum, r) => sum + r.riskIncrease, 0);
        const newScore = (0, riskCalculator_1.capRiskScore)(customer.risk_score + totalRiskIncrease);
        const riskCategory = (0, riskCalculator_1.calculateRiskCategory)(newScore);
        const updatedCustomer = await customerRepository_1.default.updateRiskScore(customer.id, newScore, riskCategory);
        if (!updatedCustomer)
            return [];
        const alerts = [];
        for (const rule of triggeredRules) {
            const alert = await alertGenerationService_1.default.createAlert({
                customerId: customer.id,
                transactionId: rule.transactionId,
                alertType: rule.rule,
                riskScore: newScore,
                severity: (0, riskCalculator_1.calculateSeverity)(newScore),
            });
            alerts.push(alert);
            await notificationService_1.default.notifyNewAlert(alert, updatedCustomer);
        }
        if (riskCategory === 'High' && customer.risk_category !== 'High') {
            await notificationService_1.default.notifyHighRiskCustomer(updatedCustomer);
        }
        return alerts;
    }
}
exports.default = new AmlRulesEngine();
//# sourceMappingURL=amlRulesEngine.js.map