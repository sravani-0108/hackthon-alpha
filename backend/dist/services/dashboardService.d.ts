import { Alert } from '../models/Alert';
declare class DashboardService {
    getStats(): Promise<{
        totalCustomers: number;
        totalAlerts: number;
        openAlerts: number;
        escalatedAlerts: number;
        highRisk: number;
        inProgressInvestigations: number;
        totalInvestigations: number;
        activeCases: number;
        severityBreakdown: {
            critical: number;
            high: number;
            medium: number;
            low: number;
        };
        recentOpenAlerts: Alert[];
    }>;
}
declare const _default: DashboardService;
export default _default;
//# sourceMappingURL=dashboardService.d.ts.map