import { QueryFilters } from '../types';
declare class CustomerService {
    getCustomers(query: QueryFilters): Promise<{
        customers: import("../models").Customer[];
        pagination: import("../types").PaginationMeta;
    }>;
    getCustomerById(id: number): Promise<{
        profile: {
            id: number;
            customer_number: string;
            name: string;
            dob: string | null;
            address: string | null;
            pan: string | null;
            occupation: string | null;
            created_at: Date;
        };
        accounts: import("../models").Account[] | undefined;
        riskInformation: {
            risk_score: number;
            risk_category: import("../types").RiskCategory;
        };
        alertCount: {
            total: number;
            open: number;
        };
        recentTransactions: import("../models").Transaction[];
    }>;
    getCustomerTransactions(id: number, limit?: number | null): Promise<import("../models").Transaction[]>;
    getCustomerRiskProfile(id: number): Promise<{
        customerId: number;
        customerName: string;
        customerRisk: import("../types").RiskCategory;
        riskScore: number;
        country: string;
        occupation: string | null;
        isPep: boolean;
        openAlerts: number;
        accountCount: number;
    }>;
}
declare const _default: CustomerService;
export default _default;
//# sourceMappingURL=customerService.d.ts.map