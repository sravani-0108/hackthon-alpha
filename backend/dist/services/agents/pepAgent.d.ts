export interface PepCheckResult {
    pepMatch: boolean;
    pepDetails: {
        name: string;
        position: string;
        source: string;
    } | null;
    checkedDatabases: string[];
    isDirectPep: boolean;
    summary: string;
}
declare class PepAgent {
    check(customerId: number): Promise<PepCheckResult>;
}
declare const _default: PepAgent;
export default _default;
//# sourceMappingURL=pepAgent.d.ts.map