export interface TransactionAnalysisResult {
    usualMonthlyAverage: number;
    currentTransfer: number;
    transactionCount30Days: number;
    velocityPattern: string;
    spikeMultiplier: number;
    risk: string;
    triggerTransactionId: number | null;
    triggerAccountNumber: string | null;
    dataVerified: boolean;
    recentTransactions: Array<{
        amount: number;
        type: string;
        date: string;
        country: string | null;
    }>;
    summary: string;
}
declare class TransactionAgent {
    analyze(alertId: number, customerId: number): Promise<TransactionAnalysisResult>;
}
declare const _default: TransactionAgent;
export default _default;
//# sourceMappingURL=transactionAgent.d.ts.map