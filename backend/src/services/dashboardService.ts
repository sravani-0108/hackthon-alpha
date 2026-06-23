import { Not } from 'typeorm';
import customerRepository from '../repositories/customerRepository';
import alertRepository from '../repositories/alertRepository';
import { AppDataSource } from '../config/database';
import { Alert } from '../models/Alert';
import { Investigation } from '../models/Investigation';
import { Case } from '../models/Case';

class DashboardService {
  async getStats() {
    const alertRepo = AppDataSource.getRepository(Alert);
    const investigationRepo = AppDataSource.getRepository(Investigation);
    const caseRepo = AppDataSource.getRepository(Case);

    const [
      totalCustomers,
      highRisk,
      openAlerts,
      totalAlerts,
      escalatedAlerts,
      inProgressInvestigations,
      totalInvestigations,
      activeCases,
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
      recentOpenAlertsResult,
    ] = await Promise.all([
      customerRepository.countAll(),
      alertRepository.countHighAndCritical(),
      alertRepository.countOpen(),
      alertRepository.countAll(),
      alertRepository.countByStatus('Escalated'),
      investigationRepo.count({ where: { status: 'Under Investigation' } }),
      investigationRepo.count(),
      caseRepo.count({ where: { status: Not('Closed') } }),
      alertRepo.count({ where: { severity: 'Critical' } }),
      alertRepo.count({ where: { severity: 'High' } }),
      alertRepo.count({ where: { severity: 'Medium' } }),
      alertRepo.count({ where: { severity: 'Low' } }),
      alertRepository.findAll({
        offset: 0,
        limit: 5,
        status: 'Open',
        sortBy: 'created_at',
        sortOrder: 'DESC',
      }),
    ]);

    return {
      totalCustomers,
      totalAlerts,
      openAlerts,
      escalatedAlerts,
      highRisk,
      inProgressInvestigations,
      totalInvestigations,
      activeCases,
      severityBreakdown: {
        critical: criticalCount,
        high: highCount,
        medium: mediumCount,
        low: lowCount,
      },
      recentOpenAlerts: recentOpenAlertsResult.rows,
    };
  }
}

export default new DashboardService();
