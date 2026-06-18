import { AppDataSource } from '../config/database';
import { Investigation } from '../models/Investigation';
import { AgentResult } from '../models/AgentResult';
import investigationRepository from '../repositories/investigationRepository';
import alertRepository from '../repositories/alertRepository';
import agentService from './agentService';
import notificationService from './notificationService';
import { getPaginationParams, buildPaginationMeta } from '../utils/pagination';
import { AppError, InvestigationAction, QueryFilters } from '../types';
import { AlertStatus, InvestigationStatus } from '../types';

const ACTION_STATUS_MAP: Record<
  InvestigationAction,
  { investigation: InvestigationStatus; alert: AlertStatus }
> = {
  legitimate: { investigation: 'Legitimate', alert: 'Cleared' },
  escalate: { investigation: 'Escalated', alert: 'Escalated' },
  close: { investigation: 'Closed', alert: 'Closed' },
};

interface CreateInvestigationInput {
  alertId: number;
  managerId?: number;
  notes?: string;
  action?: InvestigationAction;
}

type StageStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

interface InvestigationStage {
  name: 'Internal Data Analysis' | 'External Screening' | 'Investigation & Decision';
  status: StageStatus;
  summary: string;
}

class InvestigationService {
  private inferRiskLevel(report: string | null): 'LOW' | 'MEDIUM' | 'HIGH' {
    if (!report) return 'MEDIUM';
    const scoreMatch = report.match(/Overall risk score:\s*(\d{1,3})\/100/i);
    const score = scoreMatch ? parseInt(scoreMatch[1], 10) : NaN;
    if (!Number.isNaN(score)) {
      if (score >= 70) return 'HIGH';
      if (score >= 40) return 'MEDIUM';
      return 'LOW';
    }
    return 'MEDIUM';
  }

  private buildStageSummary(agentResults: AgentResult[], types: string[]): string {
    const summaries = agentResults
      .filter((r) => types.includes(r.agent_type))
      .map((r) => {
        const result = r.result as Record<string, unknown>;
        const summary = result?.summary;
        return typeof summary === 'string' ? summary.trim() : '';
      })
      .filter(Boolean);

    return summaries.length > 0 ? summaries.join(' ') : 'Analysis pending.';
  }

  private buildStages(agentResults: AgentResult[], investigationStatus: InvestigationStatus): InvestigationStage[] {
    const stageDefs: Array<{ name: InvestigationStage['name']; agentTypes: string[] }> = [
      { name: 'Internal Data Analysis', agentTypes: ['customer_analysis', 'transaction_analysis'] },
      { name: 'External Screening', agentTypes: ['sanctions_check', 'pep_check', 'media_analysis'] },
      { name: 'Investigation & Decision', agentTypes: ['investigation', 'decision', 'report'] },
    ];

    return stageDefs.map((stage) => {
      const completedCount = agentResults.filter((r) => stage.agentTypes.includes(r.agent_type)).length;
      const totalCount = stage.agentTypes.length;

      let status: StageStatus = 'NOT_STARTED';
      if (completedCount === totalCount && totalCount > 0) {
        status = 'COMPLETED';
      } else if (completedCount > 0) {
        status = 'IN_PROGRESS';
      }

      if (investigationStatus === 'Closed' && status !== 'COMPLETED') {
        status = 'FAILED';
      }

      return {
        name: stage.name,
        status,
        summary: this.buildStageSummary(agentResults, stage.agentTypes),
      };
    });
  }

  async startAiInvestigation(alertId: number, managerId?: number) {
    const alert = await alertRepository.findById(alertId);
    if (!alert) {
      const error = new Error('Alert not found.') as AppError;
      error.statusCode = 404;
      throw error;
    }
    if (alert.status !== 'Open') {
      const error = new Error(
        `Investigation can only be started for Open alerts. Current status: ${alert.status}.`
      ) as AppError;
      error.statusCode = 409;
      throw error;
    }

    const result = await agentService.runFullInvestigation(alertId, managerId);

    if (alert.customer) {
      await notificationService.notifyInvestigationComplete(alert, result.decision, result.confidence);
    }

    return this.getInvestigationById(result.investigationId);
  }

  async getInvestigationById(id: number) {
    const investigation = await AppDataSource.getRepository(Investigation).findOne({
      where: { id },
      relations: ['alert', 'alert.customer', 'alert.transaction', 'manager', 'agentResults'],
    });
    if (!investigation) {
      const error = new Error('Investigation not found.') as AppError;
      error.statusCode = 404;
      throw error;
    }
    return investigation;
  }

  async getInvestigationReport(id: number) {
    const investigation = await this.getInvestigationById(id);
    const agentResults = await AppDataSource.getRepository(AgentResult).find({
      where: { investigation_id: id },
      order: { created_at: 'ASC' },
    });

    const investigationStatus =
      investigation.status === 'Completed'
        ? 'COMPLETED'
        : investigation.status === 'Closed'
          ? 'FAILED'
          : 'IN_PROGRESS';
    const stages = this.buildStages(agentResults, investigation.status);
    const finalDecision =
      investigation.ai_decision === 'SAR'
        ? 'FILE_SAR'
        : (investigation.ai_decision ?? 'ESCALATE');
    const riskLevel = this.inferRiskLevel(investigation.report_summary);

    return {
      alertId: String(investigation.alert_id),
      investigationStatus,
      stages,
      finalDecision,
      riskLevel,
      confidenceScore: investigation.confidence ?? 0,
      complianceNarrative: investigation.report_summary ?? '',
      investigationId: investigation.id,
      status: investigation.status,
      decision: investigation.ai_decision,
      confidence: investigation.confidence,
      report: investigation.report_summary,
      agentResults: agentResults.map((r) => ({
        agent: r.agent_type,
        result: r.result,
        timestamp: r.created_at,
      })),
    };
  }

  async createInvestigation({ alertId, managerId, notes, action }: CreateInvestigationInput) {
    const alert = await alertRepository.findById(alertId);
    if (!alert) {
      const error = new Error('Alert not found.') as AppError;
      error.statusCode = 404;
      throw error;
    }

    const status: InvestigationStatus =
      action && ACTION_STATUS_MAP[action]
        ? ACTION_STATUS_MAP[action].investigation
        : 'Under Investigation';

    const investigation = await investigationRepository.create({
      alert_id: alertId,
      manager_id: managerId || null,
      notes,
      status,
    });

    await alertRepository.update(alertId, {
      status:
        action && ACTION_STATUS_MAP[action]
          ? ACTION_STATUS_MAP[action].alert
          : 'Under Investigation',
    });

    if (action === 'escalate' && alert.customer) {
      await notificationService.notifyAlertEscalated(alert, alert.customer);
    }

    return investigationRepository.findById(investigation.id);
  }

  async updateInvestigation(id: number, { notes, action }: { notes?: string; action?: InvestigationAction }) {
    const investigation = await investigationRepository.findById(id);
    if (!investigation) {
      const error = new Error('Investigation not found.') as AppError;
      error.statusCode = 404;
      throw error;
    }

    const updateData: { notes?: string; status?: InvestigationStatus } = {};
    if (notes !== undefined) updateData.notes = notes;

    if (action && ACTION_STATUS_MAP[action]) {
      updateData.status = ACTION_STATUS_MAP[action].investigation;
      await alertRepository.update(investigation.alert_id, {
        status: ACTION_STATUS_MAP[action].alert,
      });

      if (action === 'escalate') {
        const alert = await alertRepository.findById(investigation.alert_id);
        if (alert?.customer) {
          await notificationService.notifyAlertEscalated(alert, alert.customer);
        }
      }
    }

    return investigationRepository.update(id, updateData);
  }

  async getInvestigations(query: QueryFilters) {
    const { page, limit, offset } = getPaginationParams(query);

    const { count, rows } = await investigationRepository.findAll({
      offset,
      limit,
      status: query.status as InvestigationStatus | undefined,
      managerId: query.managerId ? parseInt(query.managerId, 10) : undefined,
    });

    return { investigations: rows, pagination: buildPaginationMeta(count, page, limit) };
  }
}

export default new InvestigationService();
