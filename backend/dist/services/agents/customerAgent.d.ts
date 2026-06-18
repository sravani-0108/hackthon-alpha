export interface CustomerAnalysisResult {
    customerId: number;
    customerName: string;
    customerRisk: string;
    country: string;
    occupation: string;
    accountAgeDays: number;
    riskScore: number;
    isPep: boolean;
    accountCount: number;
    totalBalance: number;
    summary: string;
}
declare class CustomerAgent {
    analyze(customerId: number): Promise<CustomerAnalysisResult>;
}
declare const _default: CustomerAgent;
export default _default;
//# sourceMappingURL=customerAgent.d.ts.map