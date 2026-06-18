"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../../config/database");
const Investigation_1 = require("../../models/Investigation");
const AgentResult_1 = require("../../models/AgentResult");
const AlertEvidence_1 = require("../../models/AlertEvidence");
const alertRepository_1 = __importDefault(require("../../repositories/alertRepository"));
const caseService_1 = __importDefault(require("../caseService"));
const reportAgent_1 = __importDefault(require("./reportAgent"));
const runner_1 = require("../../adk/runner");
class Orchestrator {
    async runInvestigation(alertId, managerId) {
        const alert = await alertRepository_1.default.findById(alertId);
        if (!alert)
            throw Object.assign(new Error('Alert not found.'), { statusCode: 404 });
        const investigationRepo = database_1.AppDataSource.getRepository(Investigation_1.Investigation);
        const investigation = await investigationRepo.save(investigationRepo.create({
            alert_id: alertId,
            manager_id: managerId || null,
            status: 'Under Investigation',
            started_at: new Date(),
        }));
        await alertRepository_1.default.update(alertId, { status: 'Under Investigation' });
        const pipeline = await (0, runner_1.runAmlTriage)(alertId);
        const { customer: customerResult, transaction: transactionResult, sanctions: sanctionsResult, pep: pepResult, media: mediaResult, synthesis, decision: decisionResult, } = pipeline;
        const report = reportAgent_1.default.generate(customerResult, transactionResult, synthesis, decisionResult, pepResult, mediaResult);
        const agentResultsMap = {
            customer_analysis: customerResult,
            transaction_analysis: transactionResult,
            sanctions_check: sanctionsResult,
            pep_check: pepResult,
            media_analysis: mediaResult,
            investigation: synthesis,
            decision: decisionResult,
            report: { summary: report.split('\n').slice(-6).join('\n'), fullReport: report },
        };
        const agentResultRepo = database_1.AppDataSource.getRepository(AgentResult_1.AgentResult);
        const agentTypes = [
            'customer_analysis',
            'transaction_analysis',
            'sanctions_check',
            'pep_check',
            'media_analysis',
            'investigation',
            'decision',
            'report',
        ];
        for (const agentType of agentTypes) {
            await agentResultRepo.save(agentResultRepo.create({
                investigation_id: investigation.id,
                agent_type: agentType,
                result: agentResultsMap[agentType],
            }));
        }
        const evidenceRepo = database_1.AppDataSource.getRepository(AlertEvidence_1.AlertEvidence);
        await evidenceRepo.save([
            evidenceRepo.create({
                alert_id: alertId,
                evidence_type: 'Customer Profile',
                description: customerResult.summary,
                source: 'Customer Profile Agent',
            }),
            evidenceRepo.create({
                alert_id: alertId,
                evidence_type: 'Transaction Analysis',
                description: transactionResult.summary,
                source: 'Transaction Analysis Agent',
                metadata: { risk: transactionResult.risk, spikeMultiplier: transactionResult.spikeMultiplier },
            }),
            evidenceRepo.create({
                alert_id: alertId,
                evidence_type: 'Screening',
                description: `${sanctionsResult.summary} ${pepResult.summary}`,
                source: 'Sanctions & PEP Agents',
            }),
        ]);
        const alertStatus = decisionResult.decision === 'CLEAR'
            ? 'Cleared'
            : decisionResult.decision === 'ESCALATE'
                ? 'Escalated'
                : 'Escalated';
        await alertRepository_1.default.update(alertId, { status: alertStatus });
        investigation.status = 'Completed';
        investigation.ai_decision = decisionResult.decision;
        investigation.confidence = decisionResult.confidence;
        investigation.report_summary = report;
        investigation.completed_at = new Date();
        await investigationRepo.save(investigation);
        let caseId;
        if (decisionResult.decision !== 'CLEAR') {
            const amlCase = await caseService_1.default.createFromInvestigation(investigation.id, alertId, alert.customer_id, alert.severity, report.split('\n').slice(0, 5).join(' '));
            caseId = amlCase.id;
            if (decisionResult.decision === 'SAR') {
                await caseService_1.default.createSarReport(amlCase.id, investigation.id, alert.customer_id, reportAgent_1.default.generateSarNarrative(customerResult, transactionResult, synthesis), managerId);
            }
        }
        return {
            investigationId: investigation.id,
            alertId,
            customerId: alert.customer_id,
            agentResults: agentResultsMap,
            decision: decisionResult.decision,
            confidence: decisionResult.confidence,
            report,
            caseId,
        };
    }
}
exports.default = new Orchestrator();
//# sourceMappingURL=orchestrator.js.map