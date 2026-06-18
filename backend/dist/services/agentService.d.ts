declare class AgentService {
    customerAnalysis(alertId: number): Promise<import("./agents/customerAgent").CustomerAnalysisResult | import("./agents/transactionAgent").TransactionAnalysisResult | import("./agents/sanctionsAgent").SanctionsCheckResult | import("./agents/pepAgent").PepCheckResult | import("./agents/mediaAgent").MediaAnalysisResult>;
    transactionAnalysis(alertId: number): Promise<import("./agents/customerAgent").CustomerAnalysisResult | import("./agents/transactionAgent").TransactionAnalysisResult | import("./agents/sanctionsAgent").SanctionsCheckResult | import("./agents/pepAgent").PepCheckResult | import("./agents/mediaAgent").MediaAnalysisResult>;
    sanctionsCheck(alertId: number): Promise<import("./agents/customerAgent").CustomerAnalysisResult | import("./agents/transactionAgent").TransactionAnalysisResult | import("./agents/sanctionsAgent").SanctionsCheckResult | import("./agents/pepAgent").PepCheckResult | import("./agents/mediaAgent").MediaAnalysisResult>;
    pepCheck(alertId: number): Promise<import("./agents/customerAgent").CustomerAnalysisResult | import("./agents/transactionAgent").TransactionAnalysisResult | import("./agents/sanctionsAgent").SanctionsCheckResult | import("./agents/pepAgent").PepCheckResult | import("./agents/mediaAgent").MediaAnalysisResult>;
    mediaAnalysis(alertId: number): Promise<import("./agents/customerAgent").CustomerAnalysisResult | import("./agents/transactionAgent").TransactionAnalysisResult | import("./agents/sanctionsAgent").SanctionsCheckResult | import("./agents/pepAgent").PepCheckResult | import("./agents/mediaAgent").MediaAnalysisResult>;
    finalDecision(alertId: number): Promise<import("./agents/decisionAgent").DecisionResult>;
    runFullInvestigation(alertId: number, managerId?: number): Promise<import("../types").OrchestratorResult>;
}
declare const _default: AgentService;
export default _default;
//# sourceMappingURL=agentService.d.ts.map