"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = __importDefault(require("../../config"));
const customerRepository_1 = __importDefault(require("../../repositories/customerRepository"));
const database_1 = require("../../config/database");
const Transaction_1 = require("../../models/Transaction");
const Account_1 = require("../../models/Account");
const highRiskCountryService_1 = __importDefault(require("../highRiskCountryService"));
const SANCTIONS_ENTRIES = [
    { name: 'Mohammed Ali Hassan', list: 'OFAC', country: 'Syria' },
    { name: 'Global Trade Corp', list: 'UN', country: 'North Korea' },
    { name: 'Eastern Holdings Ltd', list: 'EU', country: 'Iran' },
    { name: 'Blackstone Trading', list: 'Internal Watchlist', country: 'Afghanistan' },
];
class SanctionsAgent {
    async check(customerId) {
        const customer = await customerRepository_1.default.findById(customerId);
        if (!customer)
            throw new Error('Customer not found');
        const highRiskCountries = await highRiskCountryService_1.default.getCountries();
        const nameMatch = SANCTIONS_ENTRIES.some((entry) => entry.name.toLowerCase() === customer.name.toLowerCase());
        const accounts = await database_1.AppDataSource.getRepository(Account_1.Account).find({
            where: { customer_id: customerId },
        });
        const accountIds = accounts.map((a) => a.id);
        let highRiskCountryTransactions = 0;
        if (accountIds.length) {
            const txns = await database_1.AppDataSource.getRepository(Transaction_1.Transaction)
                .createQueryBuilder('t')
                .where('t.account_id IN (:...accountIds)', { accountIds })
                .getMany();
            highRiskCountryTransactions = txns.filter((t) => t.country &&
                highRiskCountries.has(t.country.trim().toLowerCase())).length;
        }
        const countryMatch = customer.country
            ? highRiskCountries.has(customer.country.trim().toLowerCase())
            : false;
        const matchedLists = [];
        if (nameMatch) {
            const entry = SANCTIONS_ENTRIES.find((e) => e.name.toLowerCase() === customer.name.toLowerCase());
            if (entry)
                matchedLists.push(entry.list);
        }
        if (countryMatch)
            matchedLists.push('Country Risk List');
        if (highRiskCountryTransactions > 0)
            matchedLists.push('High-Risk Transaction Geography');
        const sanctionMatch = nameMatch || highRiskCountryTransactions > 0;
        return {
            sanctionMatch,
            matchedLists,
            checkedLists: config_1.default.aml.sanctionsList,
            highRiskCountryTransactions,
            summary: sanctionMatch
                ? `Sanctions concern detected. Matches: ${matchedLists.join(', ')}.`
                : `No direct sanctions match found across ${config_1.default.aml.sanctionsList.join(', ')}.`,
        };
    }
}
exports.default = new SanctionsAgent();
//# sourceMappingURL=sanctionsAgent.js.map