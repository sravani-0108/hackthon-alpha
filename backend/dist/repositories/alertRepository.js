"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const database_1 = require("../config/database");
const pagination_1 = require("../utils/pagination");
const Alert_1 = require("../models/Alert");
class AlertRepository {
    repo() {
        return database_1.AppDataSource.getRepository(Alert_1.Alert);
    }
    async findAll({ offset, limit, search, sortBy, sortOrder, status, severity, alertType }) {
        const sortField = sortBy || 'created_at';
        const order = (sortOrder || 'DESC').toUpperCase();
        const qb = (0, pagination_1.applyQueryPagination)(this.repo()
            .createQueryBuilder('alert')
            .leftJoinAndSelect('alert.customer', 'customer')
            .leftJoinAndSelect('alert.transaction', 'transaction'), offset, limit).orderBy(`alert.${sortField}`, order);
        if (status)
            qb.andWhere('alert.status = :status', { status });
        if (severity)
            qb.andWhere('alert.severity = :severity', { severity });
        if (alertType)
            qb.andWhere('alert.alert_type = :alertType', { alertType });
        if (search) {
            qb.andWhere(new typeorm_1.Brackets((sub) => {
                sub
                    .where('customer.name ILIKE :search', { search: `%${search}%` })
                    .orWhere('customer.customer_number ILIKE :search', { search: `%${search}%` });
            }));
        }
        const [rows, count] = await qb.getManyAndCount();
        return { count, rows };
    }
    async findById(id) {
        return this.repo().findOne({
            where: { id },
            relations: { customer: { accounts: true }, transaction: true },
        });
    }
    async create(alertData) {
        const alert = this.repo().create(alertData);
        return this.repo().save(alert);
    }
    async update(id, updateData) {
        const alert = await this.repo().findOne({ where: { id } });
        if (!alert)
            return null;
        Object.assign(alert, updateData);
        return this.repo().save(alert);
    }
    async countByStatus(status) {
        return this.repo().count({ where: { status } });
    }
    async countOpen() {
        return this.repo().count({
            where: { status: 'Open' },
        });
    }
    async countHighAndCritical() {
        return this.repo().count({
            where: { severity: (0, typeorm_1.In)(['High', 'Critical']) },
        });
    }
    async countAll() {
        return this.repo().count();
    }
}
exports.default = new AlertRepository();
//# sourceMappingURL=alertRepository.js.map