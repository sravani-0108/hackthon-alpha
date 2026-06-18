"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const database_1 = require("../config/database");
const Transaction_1 = require("../models/Transaction");
const Account_1 = require("../models/Account");
class TransactionRepository {
    repo() {
        return database_1.AppDataSource.getRepository(Transaction_1.Transaction);
    }
    buildWhere(params, accountIds) {
        const where = {};
        if (accountIds) {
            where.account_id = (0, typeorm_1.In)(accountIds);
        }
        if (params.startDate && params.endDate) {
            where.transaction_date = (0, typeorm_1.Between)(new Date(params.startDate), new Date(params.endDate));
        }
        else if (params.startDate) {
            where.transaction_date = (0, typeorm_1.MoreThanOrEqual)(new Date(params.startDate));
        }
        else if (params.endDate) {
            where.transaction_date = (0, typeorm_1.LessThanOrEqual)(new Date(params.endDate));
        }
        if (params.minAmount !== undefined && params.maxAmount !== undefined) {
            where.amount = (0, typeorm_1.Between)(params.minAmount, params.maxAmount);
        }
        else if (params.minAmount !== undefined) {
            where.amount = (0, typeorm_1.MoreThanOrEqual)(params.minAmount);
        }
        else if (params.maxAmount !== undefined) {
            where.amount = (0, typeorm_1.LessThanOrEqual)(params.maxAmount);
        }
        if (params.transactionType) {
            where.transaction_type = params.transactionType;
        }
        return where;
    }
    async findAll(params) {
        const { offset, limit, ...filters } = params;
        const [rows, count] = await this.repo().findAndCount({
            where: this.buildWhere(filters),
            relations: { account: { customer: true } },
            select: {
                account: { id: true, account_number: true, customer: { id: true, name: true, customer_number: true } },
            },
            order: { transaction_date: 'DESC' },
            ...(limit != null ? { skip: offset, take: limit } : {}),
        });
        return { count, rows };
    }
    async findByCustomerId(customerId, params) {
        const accounts = await database_1.AppDataSource.getRepository(Account_1.Account).find({
            where: { customer_id: customerId },
            select: ['id'],
        });
        const ids = accounts.map((a) => a.id);
        if (ids.length === 0)
            return { count: 0, rows: [] };
        const { offset, limit, ...filters } = params;
        const [rows, count] = await this.repo().findAndCount({
            where: this.buildWhere(filters, ids),
            order: { transaction_date: 'DESC' },
            ...(limit != null ? { skip: offset, take: limit } : {}),
        });
        return { count, rows };
    }
    async findById(id) {
        return this.repo().findOne({
            where: { id },
            relations: ['account'],
        });
    }
    async create(transactionData) {
        const transaction = this.repo().create(transactionData);
        return this.repo().save(transaction);
    }
    async countAll() {
        return this.repo().count();
    }
    async countInTimeWindow(accountIds, hours, beforeDate) {
        const startDate = new Date(beforeDate);
        startDate.setHours(startDate.getHours() - hours);
        return this.repo().count({
            where: {
                account_id: (0, typeorm_1.In)(accountIds),
                transaction_date: (0, typeorm_1.Between)(startDate, beforeDate),
                status: 'Completed',
            },
        });
    }
    async countStructuringTransactions(accountIds, maxAmount, hours, beforeDate) {
        const startDate = new Date(beforeDate);
        startDate.setHours(startDate.getHours() - hours);
        return this.repo().count({
            where: {
                account_id: (0, typeorm_1.In)(accountIds),
                amount: (0, typeorm_1.LessThan)(maxAmount),
                transaction_date: (0, typeorm_1.Between)(startDate, beforeDate),
                status: 'Completed',
            },
        });
    }
    async getMonthlyVolume(accountIds, year, month) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);
        const result = await this.repo()
            .createQueryBuilder('t')
            .select('SUM(t.amount)', 'totalVolume')
            .where('t.account_id IN (:...accountIds)', { accountIds })
            .andWhere('t.transaction_date BETWEEN :startDate AND :endDate', { startDate, endDate })
            .andWhere('t.status = :status', { status: 'Completed' })
            .getRawOne();
        return parseFloat(result?.totalVolume || '0');
    }
    async getAverageMonthlyVolume(accountIds, beforeDate, excludeTransactionId) {
        if (!accountIds.length)
            return 0;
        const qb = this.repo()
            .createQueryBuilder('t')
            .select("DATE_TRUNC('month', t.transaction_date)", 'month')
            .addSelect('SUM(t.amount)', 'monthly_total')
            .where('t.account_id IN (:...accountIds)', { accountIds })
            .andWhere('t.status = :status', { status: 'Completed' })
            .andWhere('t.transaction_date < :beforeDate', { beforeDate });
        if (excludeTransactionId) {
            qb.andWhere('t.id != :excludeId', { excludeId: excludeTransactionId });
        }
        const monthlyTotals = await qb
            .groupBy("DATE_TRUNC('month', t.transaction_date)")
            .getRawMany();
        if (!monthlyTotals.length)
            return 0;
        const sum = monthlyTotals.reduce((acc, row) => acc + parseFloat(row.monthly_total || '0'), 0);
        return sum / monthlyTotals.length;
    }
    async getMonthlyVolumeExcludingTransaction(accountIds, year, month, excludeTransactionId) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);
        const qb = this.repo()
            .createQueryBuilder('t')
            .select('SUM(t.amount)', 'totalVolume')
            .where('t.account_id IN (:...accountIds)', { accountIds })
            .andWhere('t.transaction_date BETWEEN :startDate AND :endDate', { startDate, endDate })
            .andWhere('t.status = :status', { status: 'Completed' });
        if (excludeTransactionId) {
            qb.andWhere('t.id != :excludeId', { excludeId: excludeTransactionId });
        }
        const result = await qb.getRawOne();
        return parseFloat(result?.totalVolume || '0');
    }
}
exports.default = new TransactionRepository();
//# sourceMappingURL=transactionRepository.js.map