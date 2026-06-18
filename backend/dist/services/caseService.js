"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
const Case_1 = require("../models/Case");
const SarReport_1 = require("../models/SarReport");
const pagination_1 = require("../utils/pagination");
class CaseService {
    generateCaseNumber() {
        return `CASE-${Date.now().toString(36).toUpperCase()}`;
    }
    generateSarNumber() {
        return `SAR-${Date.now().toString(36).toUpperCase()}`;
    }
    async createFromInvestigation(investigationId, alertId, customerId, priority, summary) {
        const repo = database_1.AppDataSource.getRepository(Case_1.Case);
        return repo.save(repo.create({
            case_number: this.generateCaseNumber(),
            investigation_id: investigationId,
            alert_id: alertId,
            customer_id: customerId,
            priority,
            summary,
            status: 'Open',
        }));
    }
    async getCases(query) {
        const { page, limit, offset } = (0, pagination_1.getPaginationParams)(query);
        const qb = (0, pagination_1.applyQueryPagination)(database_1.AppDataSource.getRepository(Case_1.Case)
            .createQueryBuilder('c')
            .leftJoinAndSelect('c.customer', 'customer')
            .leftJoinAndSelect('c.alert', 'alert')
            .leftJoinAndSelect('c.assignee', 'assignee')
            .orderBy('c.created_at', 'DESC'), offset, limit);
        if (query.status)
            qb.andWhere('c.status = :status', { status: query.status });
        const [rows, count] = await qb.getManyAndCount();
        return {
            cases: rows,
            pagination: (0, pagination_1.buildPaginationMeta)(count, page, limit),
        };
    }
    async getCaseById(id) {
        const amlCase = await database_1.AppDataSource.getRepository(Case_1.Case).findOne({
            where: { id },
            relations: ['customer', 'alert', 'assignee', 'investigation', 'sarReports'],
        });
        if (!amlCase) {
            const error = new Error('Case not found.');
            error.statusCode = 404;
            throw error;
        }
        return amlCase;
    }
    async assignCase(id, userId) {
        const repo = database_1.AppDataSource.getRepository(Case_1.Case);
        const amlCase = await repo.findOne({ where: { id } });
        if (!amlCase) {
            const error = new Error('Case not found.');
            error.statusCode = 404;
            throw error;
        }
        amlCase.assigned_to = userId;
        amlCase.status = 'Assigned';
        return repo.save(amlCase);
    }
    async closeCase(id) {
        const repo = database_1.AppDataSource.getRepository(Case_1.Case);
        const amlCase = await repo.findOne({ where: { id } });
        if (!amlCase) {
            const error = new Error('Case not found.');
            error.statusCode = 404;
            throw error;
        }
        amlCase.status = 'Closed';
        amlCase.closed_at = new Date();
        return repo.save(amlCase);
    }
    async createSarReport(caseId, investigationId, customerId, narrative, filedBy) {
        const repo = database_1.AppDataSource.getRepository(SarReport_1.SarReport);
        const sar = await repo.save(repo.create({
            case_id: caseId,
            investigation_id: investigationId,
            customer_id: customerId,
            report_number: this.generateSarNumber(),
            narrative,
            filed_by: filedBy || null,
            status: 'Draft',
        }));
        const caseRepo = database_1.AppDataSource.getRepository(Case_1.Case);
        await caseRepo.update(caseId, { status: 'SAR Filed' });
        return sar;
    }
}
exports.default = new CaseService();
//# sourceMappingURL=caseService.js.map