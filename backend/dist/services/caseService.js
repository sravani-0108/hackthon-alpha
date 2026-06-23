"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
const Case_1 = require("../models/Case");
const Investigation_1 = require("../models/Investigation");
const Alert_1 = require("../models/Alert");
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
            status: 'Under Review',
        }));
    }
    async getCases(query) {
        const { page, limit, offset } = (0, pagination_1.getPaginationParams)(query);
        const qb = (0, pagination_1.applyQueryPagination)(database_1.AppDataSource.getRepository(Case_1.Case)
            .createQueryBuilder('c')
            .leftJoinAndSelect('c.customer', 'customer')
            .leftJoinAndSelect('c.alert', 'alert')
            .leftJoinAndSelect('c.assignee', 'assignee')
            .leftJoinAndSelect('c.investigation', 'investigation')
            .orderBy('c.created_at', 'DESC'), offset, limit);
        if (query.status) {
            qb.andWhere('c.status = :status', { status: query.status });
        }
        else if (query.includeClosed !== 'true') {
            qb.andWhere('c.status != :closed', { closed: 'Closed' });
        }
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
    async resolveCase(id, decision, managerId, notes) {
        const caseRepo = database_1.AppDataSource.getRepository(Case_1.Case);
        const amlCase = await caseRepo.findOne({
            where: { id },
            relations: ['investigation', 'sarReports'],
        });
        if (!amlCase) {
            const error = new Error('Case not found.');
            error.statusCode = 404;
            throw error;
        }
        if (amlCase.status === 'Closed' || amlCase.status === 'SAR Filed') {
            const error = new Error(`Case is already ${amlCase.status} and cannot be changed.`);
            error.statusCode = 409;
            throw error;
        }
        const investigationRepo = database_1.AppDataSource.getRepository(Investigation_1.Investigation);
        const alertRepo = database_1.AppDataSource.getRepository(Alert_1.Alert);
        const investigation = amlCase.investigation ?? (await investigationRepo.findOne({ where: { id: amlCase.investigation_id } }));
        if (!investigation) {
            const error = new Error('Linked investigation not found.');
            error.statusCode = 404;
            throw error;
        }
        const manualNote = notes?.trim()
            ? `[Manual ${decision} by analyst ${managerId} at ${new Date().toISOString()}] ${notes.trim()}`
            : `[Manual ${decision} by analyst ${managerId} at ${new Date().toISOString()}]`;
        investigation.notes = investigation.notes ? `${investigation.notes}\n${manualNote}` : manualNote;
        investigation.ai_decision = decision;
        investigation.completed_at = investigation.completed_at ?? new Date();
        if (decision === 'CLEAR') {
            investigation.status = 'Legitimate';
            amlCase.status = 'Closed';
            amlCase.closed_at = new Date();
            await alertRepo.update(amlCase.alert_id, { status: 'Cleared' });
        }
        else {
            investigation.status = 'Escalated';
            amlCase.status = 'SAR Filed';
            amlCase.closed_at = new Date();
            const existingSar = amlCase.sarReports?.length
                ? amlCase.sarReports[0]
                : await database_1.AppDataSource.getRepository(SarReport_1.SarReport).findOne({ where: { case_id: id } });
            if (!existingSar) {
                const narrative = notes?.trim() ||
                    investigation.report_summary?.slice(0, 3000) ||
                    `Manual SAR filed for case ${amlCase.case_number}. Analyst determined suspicious activity requires regulatory reporting.`;
                await this.createSarReport(amlCase.id, amlCase.investigation_id, amlCase.customer_id, narrative, managerId);
            }
            else if (notes?.trim()) {
                existingSar.narrative = `${existingSar.narrative}\n\n[Analyst update] ${notes.trim()}`;
                existingSar.filed_by = managerId;
                existingSar.filed_at = new Date();
                await database_1.AppDataSource.getRepository(SarReport_1.SarReport).save(existingSar);
            }
            await alertRepo.update(amlCase.alert_id, { status: 'Escalated' });
        }
        await investigationRepo.save(investigation);
        return caseRepo.save(amlCase);
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