export interface SanctionsCheckResult {
    sanctionMatch: boolean;
    matchedLists: string[];
    checkedLists: string[];
    highRiskCountryTransactions: number;
    summary: string;
}
declare class SanctionsAgent {
    check(customerId: number): Promise<SanctionsCheckResult>;
}
declare const _default: SanctionsAgent;
export default _default;
//# sourceMappingURL=sanctionsAgent.d.ts.map