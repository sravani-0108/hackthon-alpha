declare class DashboardService {
    getStats(): Promise<{
        totalCustomers: number;
        totalAlerts: number;
        openAlerts: number;
        highRiskCustomers: number;
        recentAlerts: import("../models").Alert[];
    }>;
}
declare const _default: DashboardService;
export default _default;
//# sourceMappingURL=dashboardService.d.ts.map