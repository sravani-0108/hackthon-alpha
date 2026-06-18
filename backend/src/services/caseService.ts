import { AppDataSource } from '../config/database';
import { Case } from '../models/Case';
import { Investigation } from '../models/Investigation';
import { Alert } from '../models/Alert';
import { SarReport } from '../models/SarReport';
import { AppError, AiDecisionType, CaseStatus } from '../types';
import { applyQueryPagination, buildPaginationMeta, getPaginationParams } from '../utils/pagination';

export type ManualCaseDecision = 'CLEAR' | 'SAR';

class CaseService {
  private generateCaseNumber(): string {
    return `CASE-${Date.now().toString(36).toUpperCase()}`;
  }

  private generateSarNumber(): string {
    return `SAR-${Date.now().toString(36).toUpperCase()}`;
  }

  async createFromInvestigation(
    investigationId: number,
    alertId: number,
    customerId: number,
    priority: Case['priority'],
    summary: string
  ) {
    const repo = AppDataSource.getRepository(Case);
    return repo.save(
      repo.create({
        case_number: this.generateCaseNumber(),
        investigation_id: investigationId,
        alert_id: alertId,
        customer_id: customerId,
        priority,
        summary,
        status: 'Open',
      })
    );
  }

  async getCases(query: { page?: string; limit?: string; status?: string }) {
    const { page, limit, offset } = getPaginationParams(query);

    const qb = applyQueryPagination(
      AppDataSource.getRepository(Case)
        .createQueryBuilder('c')
        .leftJoinAndSelect('c.customer', 'customer')
        .leftJoinAndSelect('c.alert', 'alert')
        .leftJoinAndSelect('c.assignee', 'assignee')
        .orderBy('c.created_at', 'DESC'),
      offset,
      limit
    );

    if (query.status) qb.andWhere('c.status = :status', { status: query.status });

    const [rows, count] = await qb.getManyAndCount();

    return {
      cases: rows,
      pagination: buildPaginationMeta(count, page, limit),
    };
  }

  async getCaseById(id: number) {
    const amlCase = await AppDataSource.getRepository(Case).findOne({
      where: { id },
      relations: ['customer', 'alert', 'assignee', 'investigation', 'sarReports'],
    });
    if (!amlCase) {
      const error = new Error('Case not found.') as AppError;
      error.statusCode = 404;
      throw error;
    }
    return amlCase;
  }

  async assignCase(id: number, userId: number) {
    const repo = AppDataSource.getRepository(Case);
    const amlCase = await repo.findOne({ where: { id } });
    if (!amlCase) {
      const error = new Error('Case not found.') as AppError;
      error.statusCode = 404;
      throw error;
    }
    amlCase.assigned_to = userId;
    amlCase.status = 'Assigned';
    return repo.save(amlCase);
  }

  async closeCase(id: number) {
    const repo = AppDataSource.getRepository(Case);
    const amlCase = await repo.findOne({ where: { id } });
    if (!amlCase) {
      const error = new Error('Case not found.') as AppError;
      error.statusCode = 404;
      throw error;
    }
    amlCase.status = 'Closed';
    amlCase.closed_at = new Date();
    return repo.save(amlCase);
  }

  async resolveCase(id: number, decision: ManualCaseDecision, managerId: number, notes?: string) {
    const caseRepo = AppDataSource.getRepository(Case);
    const amlCase = await caseRepo.findOne({
      where: { id },
      relations: ['investigation', 'sarReports'],
    });

    if (!amlCase) {
      const error = new Error('Case not found.') as AppError;
      error.statusCode = 404;
      throw error;
    }

    if (amlCase.status === 'Closed' || amlCase.status === 'SAR Filed') {
      const error = new Error(`Case is already ${amlCase.status} and cannot be changed.`) as AppError;
      error.statusCode = 409;
      throw error;
    }

    const investigationRepo = AppDataSource.getRepository(Investigation);
    const alertRepo = AppDataSource.getRepository(Alert);
    const investigation = amlCase.investigation ?? (await investigationRepo.findOne({ where: { id: amlCase.investigation_id } }));

    if (!investigation) {
      const error = new Error('Linked investigation not found.') as AppError;
      error.statusCode = 404;
      throw error;
    }

    const manualNote = notes?.trim()
      ? `[Manual ${decision} by analyst ${managerId} at ${new Date().toISOString()}] ${notes.trim()}`
      : `[Manual ${decision} by analyst ${managerId} at ${new Date().toISOString()}]`;

    investigation.notes = investigation.notes ? `${investigation.notes}\n${manualNote}` : manualNote;
    investigation.ai_decision = decision as AiDecisionType;
    investigation.completed_at = investigation.completed_at ?? new Date();

    if (decision === 'CLEAR') {
      investigation.status = 'Legitimate';
      amlCase.status = 'Closed';
      amlCase.closed_at = new Date();
      await alertRepo.update(amlCase.alert_id, { status: 'Cleared' });
    } else {
      investigation.status = 'Escalated';
      amlCase.status = 'SAR Filed';
      amlCase.closed_at = new Date();

      const existingSar = amlCase.sarReports?.length
        ? amlCase.sarReports[0]
        : await AppDataSource.getRepository(SarReport).findOne({ where: { case_id: id } });

      if (!existingSar) {
        const narrative =
          notes?.trim() ||
          investigation.report_summary?.slice(0, 3000) ||
          `Manual SAR filed for case ${amlCase.case_number}. Analyst determined suspicious activity requires regulatory reporting.`;

        await this.createSarReport(
          amlCase.id,
          amlCase.investigation_id,
          amlCase.customer_id,
          narrative,
          managerId
        );
      } else if (notes?.trim()) {
        existingSar.narrative = `${existingSar.narrative}\n\n[Analyst update] ${notes.trim()}`;
        existingSar.filed_by = managerId;
        existingSar.filed_at = new Date();
        await AppDataSource.getRepository(SarReport).save(existingSar);
      }

      await alertRepo.update(amlCase.alert_id, { status: 'Escalated' });
    }

    await investigationRepo.save(investigation);
    return caseRepo.save(amlCase);
  }

  async createSarReport(
    caseId: number,
    investigationId: number,
    customerId: number,
    narrative: string,
    filedBy?: number
  ) {
    const repo = AppDataSource.getRepository(SarReport);
    const sar = await repo.save(
      repo.create({
        case_id: caseId,
        investigation_id: investigationId,
        customer_id: customerId,
        report_number: this.generateSarNumber(),
        narrative,
        filed_by: filedBy || null,
        status: 'Draft',
      })
    );

    const caseRepo = AppDataSource.getRepository(Case);
    await caseRepo.update(caseId, { status: 'SAR Filed' as CaseStatus });

    return sar;
  }
}

export default new CaseService();
