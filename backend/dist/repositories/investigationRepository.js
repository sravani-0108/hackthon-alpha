"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
const Investigation_1 = require("../models/Investigation");
class InvestigationRepository {
    repo() {
        return database_1.AppDataSource.getRepository(Investigation_1.Investigation);
    }
    async create(data) {
        const investigation = this.repo().create(data);
        return this.repo().save(investigation);
    }
    async findById(id) {
        return this.repo().findOne({
            where: { id },
            relations: { alert: { customer: true }, manager: true },
            select: {
                manager: { id: true, name: true, email: true },
            },
        });
    }
    async update(id, data) {
        const investigation = await this.repo().findOne({ where: { id } });
        if (!investigation)
            return null;
        Object.assign(investigation, data);
        await this.repo().save(investigation);
        return this.findById(id);
    }
    async findAll({ offset, limit, status, managerId }) {
        const where = {};
        if (status)
            where.status = status;
        if (managerId)
            where.manager_id = managerId;
        const [rows, count] = await this.repo().findAndCount({
            where: Object.keys(where).length ? where : undefined,
            relations: { alert: { customer: true }, manager: true },
            select: {
                alert: { id: true, alert_type: true, status: true, customer: { id: true, name: true, customer_number: true } },
                manager: { id: true, name: true, email: true },
            },
            order: { created_at: 'DESC' },
            ...(limit != null ? { skip: offset, take: limit } : {}),
        });
        return { count, rows };
    }
    async findByAlertId(alertId) {
        return this.repo().findOne({
            where: { alert_id: alertId },
            order: { created_at: 'DESC' },
        });
    }
}
exports.default = new InvestigationRepository();
//# sourceMappingURL=investigationRepository.js.map