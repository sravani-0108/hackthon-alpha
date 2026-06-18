"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const database_1 = require("../config/database");
const pagination_1 = require("../utils/pagination");
const Customer_1 = require("../models/Customer");
const Transaction_1 = require("../models/Transaction");
class CustomerRepository {
    repo() {
        return database_1.AppDataSource.getRepository(Customer_1.Customer);
    }
    async findAll({ offset, limit, search, sortBy, sortOrder, riskCategory }) {
        const sortField = sortBy || 'created_at';
        const order = (sortOrder || 'DESC').toUpperCase();
        const qb = (0, pagination_1.applyQueryPagination)(this.repo()
            .createQueryBuilder('customer')
            .select([
            'customer.id',
            'customer.customer_number',
            'customer.name',
            'customer.dob',
            'customer.address',
            'customer.pan',
            'customer.occupation',
            'customer.country',
            'customer.is_pep',
            'customer.risk_score',
            'customer.risk_category',
            'customer.created_at',
        ]), offset, limit).orderBy(`customer.${sortField}`, order);
        if (search) {
            qb.andWhere(new typeorm_1.Brackets((sub) => {
                sub
                    .where('customer.name ILIKE :search', { search: `%${search}%` })
                    .orWhere('customer.customer_number ILIKE :search', { search: `%${search}%` })
                    .orWhere('customer.pan ILIKE :search', { search: `%${search}%` });
            }));
        }
        if (riskCategory) {
            qb.andWhere('customer.risk_category = :riskCategory', { riskCategory });
        }
        const [rows, count] = await qb.getManyAndCount();
        return { count, rows };
    }
    async findById(id) {
        return this.repo().findOne({
            where: { id },
            relations: ['accounts', 'alerts'],
            select: {
                id: true,
                customer_number: true,
                name: true,
                dob: true,
                address: true,
                pan: true,
                aadhaar: true,
                occupation: true,
                country: true,
                is_pep: true,
                risk_score: true,
                risk_category: true,
                created_at: true,
                accounts: true,
                alerts: { id: true, status: true },
            },
        });
    }
    async findByIdWithTransactions(id, transactionLimit = null) {
        const customer = await this.findById(id);
        if (!customer)
            return null;
        const accountIds = customer.accounts?.map((a) => a.id) ?? [];
        let recentTransactions = [];
        if (accountIds.length > 0) {
            recentTransactions = await database_1.AppDataSource.getRepository(Transaction_1.Transaction).find({
                where: { account_id: (0, typeorm_1.In)(accountIds) },
                order: { transaction_date: 'DESC' },
                ...(transactionLimit != null ? { take: transactionLimit } : {}),
            });
        }
        return { customer, recentTransactions };
    }
    async updateRiskScore(id, riskScore, riskCategory) {
        const customer = await this.repo().findOne({ where: { id } });
        if (!customer)
            return null;
        customer.risk_score = riskScore;
        customer.risk_category = riskCategory;
        return this.repo().save(customer);
    }
    async countHighRisk() {
        return this.repo().count({ where: { risk_category: 'High' } });
    }
    async countAll() {
        return this.repo().count();
    }
}
exports.default = new CustomerRepository();
//# sourceMappingURL=customerRepository.js.map