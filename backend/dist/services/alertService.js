"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const alertRepository_1 = __importDefault(require("../repositories/alertRepository"));
const pagination_1 = require("../utils/pagination");
class AlertService {
    async getAlerts(query) {
        const { page, limit, offset } = (0, pagination_1.getPaginationParams)(query);
        const { count, rows } = await alertRepository_1.default.findAll({
            offset,
            limit,
            search: query.search,
            sortBy: query.sortBy,
            sortOrder: query.sortOrder?.toUpperCase(),
            status: query.status,
            severity: query.severity,
            alertType: query.alertType,
        });
        return { alerts: rows, pagination: (0, pagination_1.buildPaginationMeta)(count, page, limit) };
    }
    async getAlertById(id) {
        const alert = await alertRepository_1.default.findById(id);
        if (!alert) {
            const error = new Error('Alert not found.');
            error.statusCode = 404;
            throw error;
        }
        return {
            summary: {
                id: alert.id,
                alert_code: alert.alert_code,
                alert_type: alert.alert_type,
                reason: alert.reason,
                risk_score: alert.risk_score,
                severity: alert.severity,
                status: alert.status,
                created_at: alert.created_at,
            },
            triggeredRule: alert.alert_type,
            customer: alert.customer,
            relatedTransaction: alert.transaction,
        };
    }
    async createAlert(data) {
        return alertRepository_1.default.create({
            customer_id: data.customerId,
            transaction_id: data.transactionId ?? null,
            alert_type: data.alertType,
            risk_score: data.riskScore ?? 0,
            severity: data.severity ?? 'Medium',
            status: data.status ?? 'Open',
        });
    }
    async updateAlert(id, data) {
        const alert = await alertRepository_1.default.findById(id);
        if (!alert) {
            const error = new Error('Alert not found.');
            error.statusCode = 404;
            throw error;
        }
        const updateData = {};
        if (data.status !== undefined)
            updateData.status = data.status;
        if (data.severity !== undefined)
            updateData.severity = data.severity;
        if (data.risk_score !== undefined)
            updateData.risk_score = data.risk_score;
        return alertRepository_1.default.update(id, updateData);
    }
    async updateAlertStatus(id, status) {
        return this.updateAlert(id, { status });
    }
}
exports.default = new AlertService();
//# sourceMappingURL=alertService.js.map