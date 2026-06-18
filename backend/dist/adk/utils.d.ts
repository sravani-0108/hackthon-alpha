import { BaseAgent } from '@google/adk';
export declare function ensureGeminiEnv(): void;
export declare function isAdkEnabled(): boolean;
export declare function getSystemMode(): {
    llmEnabled: boolean;
    model: string;
    workflow: string;
    screeningMode: string;
    dataSources: {
        customer: string;
        transactions: string;
        screening: string;
        sanctions?: undefined;
        pep?: undefined;
        adverseMedia?: undefined;
    } | {
        customer: string;
        transactions: string;
        sanctions: string;
        pep: string;
        adverseMedia: string;
        screening?: undefined;
    };
};
export declare function runAdkAgent(agent: BaseAgent, userMessage: string): Promise<string>;
export declare function runAmlWorkflow(userMessage: string, stateDelta?: Record<string, unknown>): Promise<Record<string, unknown>>;
export declare function parseJsonFromLlm<T>(text: string, fallback: T): T;
export declare function parseStateValue<T>(value: unknown, fallback: T): T;
export declare function buildAlertPrompt(context: Record<string, unknown>): string;
export declare function buildMediaSearchPrompt(context: Record<string, unknown>): string;
//# sourceMappingURL=utils.d.ts.map