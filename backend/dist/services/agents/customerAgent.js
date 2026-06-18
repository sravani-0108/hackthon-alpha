"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const customerRepository_1 = __importDefault(require("../../repositories/customerRepository"));
const database_1 = require("../../config/database");
const Account_1 = require("../../models/Account");
class CustomerAgent {
    async analyze(customerId) {
        const customer = await customerRepository_1.default.findById(customerId);
        if (!customer)
            throw new Error('Customer not found');
        const accounts = await database_1.AppDataSource.getRepository(Account_1.Account).find({
            where: { customer_id: customerId },
        });
        const oldestAccount = accounts.reduce((oldest, acc) => {
            const opened = acc.opened_at ? new Date(acc.opened_at) : new Date();
            return !oldest || opened < oldest ? opened : oldest;
        }, null);
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
exports.default = new CustomerAgent();
//# sourceMappingURL=customerAgent.js.map