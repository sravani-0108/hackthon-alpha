"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processPendingTransactions = void 0;
const database_1 = require("../config/database");
const Transaction_1 = require("../models/Transaction");
const amlRulesEngine_1 = __importDefault(require("../services/amlRulesEngine"));
const processPendingTransactions = async () => {
    const repo = database_1.AppDataSource.getRepository(Transaction_1.Transaction);
    const pendingTransactions = await repo.find({
        where: { status: 'Pending' },
        relations: ['account'],
        take: 100,
    });
    const results = [];
    for (const transaction of pendingTransactions) {
        transaction.status = 'Completed';
        await repo.save(transaction);
        const alerts = await amlRulesEngine_1.default.evaluateTransaction(transaction);
        results.push({ transactionId: transaction.id, alertsGenerated: alerts.length });
    }
    return results;
};
exports.processPendingTransactions = processPendingTransactions;
//# sourceMappingURL=transactionMonitor.js.map