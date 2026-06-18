"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const orchestrator_1 = __importDefault(require("./agents/orchestrator"));
const runner_1 = require("../adk/runner");
class AgentService {
    async customerAnalysis(alertId) {
        return (0, runner_1.runSingleAdkAgent)('customer_analysis', alertId);
    }
    async transactionAnalysis(alertId) {
        return (0, runner_1.runSingleAdkAgent)('transaction_analysis', alertId);
    }
    async sanctionsCheck(alertId) {
        return (0, runner_1.runSingleAdkAgent)('sanctions_check', alertId);
    }
    async pepCheck(alertId) {
        return (0, runner_1.runSingleAdkAgent)('pep_check', alertId);
    }
    async mediaAnalysis(alertId) {
        return (0, runner_1.runSingleAdkAgent)('media_analysis', alertId);
    }
    async finalDecision(alertId) {
        const pipeline = await (0, runner_1.runAmlTriage)(alertId);
        return pipeline.decision;
    }
    async runFullInvestigation(alertId, managerId) {
        return orchestrator_1.default.runInvestigation(alertId, managerId);
    }
}
exports.default = new AgentService();
//# sourceMappingURL=agentService.js.map