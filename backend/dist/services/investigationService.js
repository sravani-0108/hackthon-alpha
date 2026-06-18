"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
const Investigation_1 = require("../models/Investigation");
const AgentResult_1 = require("../models/AgentResult");
const investigationRepository_1 = __importDefault(require("../repositories/investigationRepository"));
const alertRepository_1 = __importDefault(require("../repositories/alertRepository"));
const agentService_1 = __importDefault(require("./agentService"));
const notificationService_1 = __importDefault(require("./notificationService"));
const pagination_1 = require("../utils/pagination");
const ACTION_STATUS_MAP = {
    legitimate: { investigation: 'Legitimate', alert: 'Cleared' },
    escalate: { investigation: 'Escalated', alert: 'Escalated' },
    close: { investigation: 'Closed', alert: 'Closed' },
};
class InvestigationService {
    inferRiskLevel(report) {
        if (!report)
            return 'MEDIUM';
        const scoreMatch = report.match(/Overall risk score:\s*(\d{1,3})\/100/i);
        const score = scoreMatch ? parseInt(scoreMatch[1], 10) : NaN;
        if (!Number.isNaN(score)) {
            if (score >= 70)
                return 'HIGH';
            if (score >= 40)
                return 'MEDIUM';
            return 'LOW';
        }
        return 'MEDIUM';
    }
    buildStageSummary(agentResults, types) {
        const summaries = agentResults
            .filter((r) => types.includes(r.agent_type))
            .map((r) => {
            const result = r.result;
            const summary = result?.summary;
            return typeof summary === 'string' ? summary.trim() : '';
        })
            .filter(Boolean);
        return summaries.length > 0 ? summaries.join(' ') : 'Analysis pending.';
    }
    buildStages(agentResults, investigationStatus) {
        const stageDefs = [
            { name: 'Internal Data Analysis', agentTypes: ['customer_analysis', 'transaction_analysis'] },
            { name: 'External Screening', agentTypes: ['sanctions_check', 'pep_check', 'media_analysis'] },
            { name: 'Investigation & Decision', agentTypes: ['investigation', 'decision', 'report'] },
        ];
        return stageDefs.map((stage) => {
            const completedCount = agentResults.filter((r) => stage.agentTypes.includes(r.agent_type)).length;
            const totalCount = stage.agentTypes.length;
            let status = 'NOT_STARTED';
            if (completedCount === totalCount && totalCount > 0) {
                status = 'COMPLETED';
            }
            else if (completedCount > 0) {
                status = 'IN_PROGRESS';
            }
            if (investigationStatus === 'Closed' && status !== 'COMPLETED') {
                status = 'FAILED';
            }
            return {
                name: stage.name,
                status,
                summary: this.buildStageSummary(agentResults, stage.agentTypes),
            };
        });
    }
    async startAiInvestigation(alertId, managerId) {
        const alert = await alertRepository_1.default.findById(alertId);
        if (!alert) {
            const error = new Error('Alert not found.');
            error.statusCode = 404;
            throw error;
        }
        const result = await agentService_1.default.runFullInvestigation(alertId, managerId);
        if (alert.customer) {
            await notificationService_1.default.notifyInvestigationComplete(alert, result.decision, result.confidence);
        }
        return this.getInvestigationById(result.investigationId);
    }
    async getInvestigationById(id) {
        const investigation = await database_1.AppDataSource.getRepository(Investigation_1.Investigation).findOne({
            where: { id },
            relations: ['alert', 'alert.customer', 'alert.transaction', 'manager', 'agentResults'],
        });
        if (!investigation) {
            const error = new Error('Investigation not found.');
            error.statusCode = 404;
            throw error;
        }
        return investigation;
    }
    async getInvestigationReport(id) {
        const investigation = await this.getInvestigationById(id);
        const agentResults = await database_1.AppDataSource.getRepository(AgentResult_1.AgentResult).find({
            where: { investigation_id: id },
            order: { created_at: 'ASC' },
        });
        const investigationStatus = investigation.status === 'Completed'
            ? 'COMPLETED'
            : investigation.status === 'Closed'
                ? 'FAILED'
                : 'IN_PROGRESS';
        const stages = this.buildStages(agentResults, investigation.status);
        const finalDecision = investigation.ai_decision === 'SAR'
            ? 'FILE_SAR'
            : (investigation.ai_decision ?? 'ESCALATE');
        const riskLevel = this.inferRiskLevel(investigation.report_summary);
        return {
            alertId: String(investigation.alert_id),
            investigationStatus,
            stages,
            finalDecision,
            riskLevel,
            confidenceScore: investigation.confidence ?? 0,
            complianceNarrative: investigation.report_summary ?? '',
            investigationId: investigation.id,
            status: investigation.status,
            decision: investigation.ai_decision,
            confidence: investigation.confidence,
            report: investigation.report_summary,
            agentResults: agentResults.map((r) => ({
                agent: r.agent_type,
                result: r.result,
                timestamp: r.created_at,
            })),
        };
    }
    async createInvestigation({ alertId, managerId, notes, action }) {
        const alert = await alertRepository_1.default.findById(alertId);
        if (!alert) {
            const error = new Error('Alert not found.');
            error.statusCode = 404;
            throw error;
        }
        const status = action && ACTION_STATUS_MAP[action]
            ? ACTION_STATUS_MAP[action].investigation
            : 'Under Investigation';
        const investigation = await investigationRepository_1.default.create({
            alert_id: alertId,
            manager_id: managerId || null,
            notes,
            status,
        });
        await alertRepository_1.default.update(alertId, {
            status: action && ACTION_STATUS_MAP[action]
                ? ACTION_STATUS_MAP[action].alert
                : 'Under Investigation',
        });
        if (action === 'escalate' && alert.customer) {
            await notificationService_1.default.notifyAlertEscalated(alert, alert.customer);
        }
        return investigationRepository_1.default.findById(investigation.id);
    }
    async updateInvestigation(id, { notes, action }) {
        const investigation = await investigationRepository_1.default.findById(id);
        if (!investigation) {
            const error = new Error('Investigation not found.');
            error.statusCode = 404;
            throw error;
        }
        const updateData = {};
        if (notes !== undefined)
            updateData.notes = notes;
        if (action && ACTION_STATUS_MAP[action]) {
            updateData.status = ACTION_STATUS_MAP[action].investigation;
            await alertRepository_1.default.update(investigation.alert_id, {
                status: ACTION_STATUS_MAP[action].alert,
            });
            if (action === 'escalate') {
                const alert = await alertRepository_1.default.findById(investigation.alert_id);
                if (alert?.customer) {
                    await notificationService_1.default.notifyAlertEscalated(alert, alert.customer);
                }
            }
        }
        return investigationRepository_1.default.update(id, updateData);
    }
    async getInvestigations(query) {
        const { page, limit, offset } = (0, pagination_1.getPaginationParams)(query);
        const { count, rows } = await investigationRepository_1.default.findAll({
            offset,
            limit,
            status: query.status,
            managerId: query.managerId ? parseInt(query.managerId, 10) : undefined,
        });
        return { investigations: rows, pagination: (0, pagination_1.buildPaginationMeta)(count, page, limit) };
    }
}
exports.default = new InvestigationService();
//# sourceMappingURL=investigationService.js.map