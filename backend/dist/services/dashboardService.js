"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const customerRepository_1 = __importDefault(require("../repositories/customerRepository"));
const alertRepository_1 = __importDefault(require("../repositories/alertRepository"));
class DashboardService {
    async getStats() {
        const [totalCustomers, highRiskCustomers, openAlerts, totalAlerts, recentAlertsResult] = await Promise.all([
            customerRepository_1.default.countAll(),
            customerRepository_1.default.countHighRisk(),
            alertRepository_1.default.countOpen(),
            alertRepository_1.default.countAll(),
            alertRepository_1.default.findAll({ offset: 0, limit: null }),
        ]);
        return {
            totalCustomers,
            totalAlerts,
            openAlerts,
            highRiskCustomers,
            recentAlerts: recentAlertsResult.rows,
        };
    }
}
exports.default = new DashboardService();
//# sourceMappingURL=dashboardService.js.map