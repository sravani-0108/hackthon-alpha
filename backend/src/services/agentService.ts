import orchestrator from './agents/orchestrator';
import { runAmlTriage, runSingleAdkAgent } from '../adk/runner';

class AgentService {
  async customerAnalysis(alertId: number) {
    return runSingleAdkAgent('customer_analysis', alertId);
  }

  async transactionAnalysis(alertId: number) {
    return runSingleAdkAgent('transaction_analysis', alertId);
  }

  async sanctionsCheck(alertId: number) {
    return runSingleAdkAgent('sanctions_check', alertId);
  }

  async pepCheck(alertId: number) {
    return runSingleAdkAgent('pep_check', alertId);
  }

  async mediaAnalysis(alertId: number) {
    return runSingleAdkAgent('media_analysis', alertId);
  }

  async finalDecision(alertId: number) {
    const pipeline = await runAmlTriage(alertId);
    return pipeline.decision;
  }

  async runFullInvestigation(alertId: number, managerId?: number) {
    return orchestrator.runInvestigation(alertId, managerId);
  }
}

export default new AgentService();
