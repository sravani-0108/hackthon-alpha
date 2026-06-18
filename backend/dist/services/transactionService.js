"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const transactionRepository_1 = __importDefault(require("../repositories/transactionRepository"));
const customerRepository_1 = __importDefault(require("../repositories/customerRepository"));
const amlRulesEngine_1 = __importDefault(require("./amlRulesEngine"));
const pagination_1 = require("../utils/pagination");
class TransactionService {
    async getTransactions(query) {
        const { page, limit, offset } = (0, pagination_1.getPaginationParams)(query);
        const { count, rows } = await transactionRepository_1.default.findAll({
            offset,
            limit,
            startDate: query.startDate,
            endDate: query.endDate,
            minAmount: query.minAmount ? parseFloat(query.minAmount) : undefined,
            maxAmount: query.maxAmount ? parseFloat(query.maxAmount) : undefined,
            transactionType: query.transactionType,
        });
        return { transactions: rows, pagination: (0, pagination_1.buildPaginationMeta)(count, page, limit) };
    }
    async getTransactionsByCustomer(customerId, query) {
        const customer = await customerRepository_1.default.findById(customerId);
        if (!customer) {
            const error = new Error('Customer not found.');
            error.statusCode = 404;
            throw error;
        }
        const { page, limit, offset } = (0, pagination_1.getPaginationParams)(query);
        const { count, rows } = await transactionRepository_1.default.findByCustomerId(customerId, {
            offset,
            limit,
            startDate: query.startDate,
            endDate: query.endDate,
            minAmount: query.minAmount ? parseFloat(query.minAmount) : undefined,
            maxAmount: query.maxAmount ? parseFloat(query.maxAmount) : undefined,
            transactionType: query.transactionType,
        });
        return { transactions: rows, pagination: (0, pagination_1.buildPaginationMeta)(count, page, limit) };
    }
    async processTransaction(transactionData) {
        const transaction = await transactionRepository_1.default.create(transactionData);
        const alerts = await amlRulesEngine_1.default.evaluateTransaction(transaction);
        return { transaction, alerts };
    }
}
exports.default = new TransactionService();
//# sourceMappingURL=transactionService.js.map