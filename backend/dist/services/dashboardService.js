"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const customerRepository_1 = __importDefault(require("../repositories/customerRepository"));
const alertRepository_1 = __importDefault(require("../repositories/alertRepository"));
const database_1 = require("../config/database");
const Alert_1 = require("../models/Alert");
const Investigation_1 = require("../models/Investigation");
const Case_1 = require("../models/Case");
class DashboardService {
    async getStats() {
        const alertRepo = database_1.AppDataSource.getRepository(Alert_1.Alert);
        const investigationRepo = database_1.AppDataSource.getRepository(Investigation_1.Investigation);
        const caseRepo = database_1.AppDataSource.getRepository(Case_1.Case);
        const [totalCustomers, highRisk, openAlerts, totalAlerts, escalatedAlerts, inProgressInvestigations, totalInvestigations, activeCases, criticalCount, highCount, mediumCount, lowCount, recentOpenAlertsResult,] = await Promise.all([
            customerRepository_1.default.countAll(),
            alertRepository_1.default.countHighAndCritical(),
            alertRepository_1.default.countOpen(),
            alertRepository_1.default.countAll(),
            alertRepository_1.default.countByStatus('Escalated'),
            investigationRepo.count({ where: { status: 'Under Investigation' } }),
            investigationRepo.count(),
            caseRepo.count({ where: { status: (0, typeorm_1.Not)('Closed') } }),
            alertRepo.count({ where: { severity: 'Critical' } }),
            alertRepo.count({ where: { severity: 'High' } }),
            alertRepo.count({ where: { severity: 'Medium' } }),
            alertRepo.count({ where: { severity: 'Low' } }),
            alertRepository_1.default.findAll({
                offset: 0,
                limit: 5,
                status: 'Open',
                sortBy: 'created_at',
                sortOrder: 'DESC',
            }),
        ]);
        return {
            totalCustomers,
            totalAlerts,
            openAlerts,
            escalatedAlerts,
            highRisk,
            inProgressInvestigations,
            totalInvestigations,
            activeCases,
            severityBreakdown: {
                critical: criticalCount,
                high: highCount,
                medium: mediumCount,
                low: lowCount,
            },
            recentOpenAlerts: recentOpenAlertsResult.rows,
        };
    }
}
exports.default = new DashboardService();
//# sourceMappingURL=dashboardService.js.map