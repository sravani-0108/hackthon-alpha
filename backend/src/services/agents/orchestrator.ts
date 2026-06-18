import { AppDataSource } from '../../config/database';

import { Investigation } from '../../models/Investigation';

import { AgentResult } from '../../models/AgentResult';

import { AlertEvidence } from '../../models/AlertEvidence';

import { AiDecisionType, AgentType, OrchestratorResult } from '../../types';

import alertRepository from '../../repositories/alertRepository';

import caseService from '../caseService';

import reportAgent from './reportAgent';

import { runAmlTriage } from '../../adk/runner';



class Orchestrator {

  async runInvestigation(alertId: number, managerId?: number): Promise<OrchestratorResult> {

    const alert = await alertRepository.findById(alertId);

    if (!alert) throw Object.assign(new Error('Alert not found.'), { statusCode: 404 });
    if (alert.status !== 'Open') {
      throw Object.assign(
        new Error(`Investigation can only run for Open alerts. Current status: ${alert.status}.`),
        { statusCode: 409 }
      );
    }



    const investigationRepo = AppDataSource.getRepository(Investigation);

    const investigation = await investigationRepo.save(

      investigationRepo.create({

        alert_id: alertId,

        manager_id: managerId || null,

        status: 'Under Investigation',

        started_at: new Date(),

      })

    );



    await alertRepository.update(alertId, { status: 'Under Investigation' });



    const pipeline = await runAmlTriage(alertId);

    const {

      customer: customerResult,

      transaction: transactionResult,

      sanctions: sanctionsResult,

      pep: pepResult,

      media: mediaResult,

      synthesis,

      decision: decisionResult,

    } = pipeline;



    const report = reportAgent.generate(

      customerResult,

      transactionResult,

      synthesis,

      decisionResult,

      pepResult,

      mediaResult

    );



    const agentResultsMap: Record<string, unknown> = {

      customer_analysis: customerResult,

      transaction_analysis: transactionResult,

      sanctions_check: sanctionsResult,

      pep_check: pepResult,

      media_analysis: mediaResult,

      investigation: synthesis,

      decision: decisionResult,

      report: { summary: report.split('\n').slice(-6).join('\n'), fullReport: report },

    };



    const agentResultRepo = AppDataSource.getRepository(AgentResult);

    const agentTypes: AgentType[] = [

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

      await agentResultRepo.save(

        agentResultRepo.create({

          investigation_id: investigation.id,

          agent_type: agentType,

          result: agentResultsMap[agentType] as Record<string, unknown>,

        })

      );

    }



    const evidenceRepo = AppDataSource.getRepository(AlertEvidence);

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



    const alertStatus =

      decisionResult.decision === 'CLEAR'

        ? 'Cleared'

        : decisionResult.decision === 'ESCALATE'

          ? 'Escalated'

          : 'Escalated';



    await alertRepository.update(alertId, { status: alertStatus });



    investigation.status = 'Completed';

    investigation.ai_decision = decisionResult.decision;

    investigation.confidence = decisionResult.confidence;

    investigation.report_summary = report;

    investigation.completed_at = new Date();

    await investigationRepo.save(investigation);



    let caseId: number | undefined;

    if (decisionResult.decision !== 'CLEAR') {

      const amlCase = await caseService.createFromInvestigation(

        investigation.id,

        alertId,

        alert.customer_id,

        alert.severity,

        report.split('\n').slice(0, 5).join(' ')

      );

      caseId = amlCase.id;



      if (decisionResult.decision === 'SAR') {

        await caseService.createSarReport(

          amlCase.id,

          investigation.id,

          alert.customer_id,

          reportAgent.generateSarNarrative(customerResult, transactionResult, synthesis),

          managerId

        );

      }

    }



    return {

      investigationId: investigation.id,

      alertId,

      customerId: alert.customer_id,

      agentResults: agentResultsMap,

      decision: decisionResult.decision as AiDecisionType,

      confidence: decisionResult.confidence,

      report,

      caseId,

    };

  }

}



export default new Orchestrator();

