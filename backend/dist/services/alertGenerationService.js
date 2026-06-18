"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const alertRepository_1 = __importDefault(require("../repositories/alertRepository"));
class AlertGenerationService {
    async createAlert({ customerId, transactionId, alertType, riskScore, severity, status = 'Open', }) {
        return alertRepository_1.default.create({
            customer_id: customerId,
            transaction_id: transactionId ?? null,
            alert_type: alertType,
            risk_score: riskScore ?? 0,
            severity: severity ?? 'Medium',
            status,
        });
    }
}
exports.default = new AlertGenerationService();
//# sourceMappingURL=alertGenerationService.js.map