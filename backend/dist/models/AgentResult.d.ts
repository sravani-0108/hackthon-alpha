import { AgentType } from '../types';
import { Investigation } from './Investigation';
export declare class AgentResult {
    id: number;
    investigation_id: number;
    agent_type: AgentType;
    result: Record<string, unknown>;
    created_at: Date;
    investigation?: Investigation;
}
export default AgentResult;
//# sourceMappingURL=AgentResult.d.ts.map