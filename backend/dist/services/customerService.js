"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const customerRepository_1 = __importDefault(require("../repositories/customerRepository"));
const pagination_1 = require("../utils/pagination");
class CustomerService {
    async getCustomers(query) {
        const { page, limit, offset } = (0, pagination_1.getPaginationParams)(query);
        const { count, rows } = await customerRepository_1.default.findAll({
            offset,
            limit,
            search: query.search,
            sortBy: query.sortBy,
            sortOrder: query.sortOrder?.toUpperCase(),
            riskCategory: query.riskCategory,
        });
        return { customers: rows, pagination: (0, pagination_1.buildPaginationMeta)(count, page, limit) };
    }
    async getCustomerById(id) {
        const result = await customerRepository_1.default.findByIdWithTransactions(id);
        if (!result) {
            const error = new Error('Customer not found.');
            error.statusCode = 404;
            throw error;
        }
        const { customer, recentTransactions } = result;
        const openAlertCount = customer.alerts?.filter((a) => a.status !== 'Closed').length ?? 0;
        return {
            profile: {
                id: customer.id,
                customer_number: customer.customer_number,
                name: customer.name,
                dob: customer.dob,
                address: customer.address,
                pan: customer.pan,
                occupation: customer.occupation,
                created_at: customer.created_at,
            },
            accounts: customer.accounts,
            riskInformation: {
                risk_score: customer.risk_score,
                risk_category: customer.risk_category,
            },
            alertCount: {
                total: customer.alerts?.length ?? 0,
                open: openAlertCount,
            },
            recentTransactions,
        };
    }
    async getCustomerTransactions(id, limit = null) {
        const result = await customerRepository_1.default.findByIdWithTransactions(id, limit);
        if (!result) {
            const error = new Error('Customer not found.');
            error.statusCode = 404;
            throw error;
        }
        return result.recentTransactions;
    }
    async getCustomerRiskProfile(id) {
        const customer = await customerRepository_1.default.findById(id);
        if (!customer) {
            const error = new Error('Customer not found.');
            error.statusCode = 404;
            throw error;
        }
        const openAlerts = customer.alerts?.filter((a) => !['Closed', 'Cleared'].includes(a.status)).length ?? 0;
        return {
            customerId: customer.id,
            customerName: customer.name,
            customerRisk: customer.risk_category,
            riskScore: customer.risk_score,
            country: customer.country,
            occupation: customer.occupation,
            isPep: customer.is_pep,
            openAlerts,
            accountCount: customer.accounts?.length ?? 0,
        };
    }
}
exports.default = new CustomerService();
//# sourceMappingURL=customerService.js.map