import alertRepository from '../repositories/alertRepository';
import { getPaginationParams, buildPaginationMeta } from '../utils/pagination';
import { AppError, CreateAlertInput, QueryFilters } from '../types';
import { AlertSeverity, AlertStatus } from '../types';

class AlertService {
  async getAlerts(query: QueryFilters) {
    const { page, limit, offset } = getPaginationParams(query);

    const { count, rows } = await alertRepository.findAll({
      offset,
      limit,
      search: query.search,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder?.toUpperCase(),
      status: query.status as AlertStatus | undefined,
      severity: query.severity as AlertSeverity | undefined,
      alertType: query.alertType,
    });

    return { alerts: rows, pagination: buildPaginationMeta(count, page, limit) };
  }

  async getAlertById(id: number) {
    const alert = await alertRepository.findById(id);
    if (!alert) {
      const error = new Error('Alert not found.') as AppError;
      error.statusCode = 404;
      throw error;
    }

    return {
      summary: {
        id: alert.id,
        alert_code: alert.alert_code,
        alert_type: alert.alert_type,
        reason: alert.reason,
        risk_score: alert.risk_score,
        severity: alert.severity,
        status: alert.status,
        created_at: alert.created_at,
      },
      triggeredRule: alert.alert_type,
      customer: alert.customer,
      relatedTransaction: alert.transaction,
    };
  }

  async createAlert(data: CreateAlertInput) {
    return alertRepository.create({
      customer_id: data.customerId,
      transaction_id: data.transactionId ?? null,
      alert_type: data.alertType,
      risk_score: data.riskScore ?? 0,
      severity: data.severity ?? 'Medium',
      status: data.status ?? 'Open',
    });
  }

  async updateAlert(id: number, data: Partial<{ status: AlertStatus; severity: AlertSeverity; risk_score: number }>) {
    const alert = await alertRepository.findById(id);
    if (!alert) {
      const error = new Error('Alert not found.') as AppError;
      error.statusCode = 404;
      throw error;
    }

    const updateData: Partial<{ status: AlertStatus; severity: AlertSeverity; risk_score: number }> = {};
    if (data.status !== undefined) updateData.status = data.status;
    if (data.severity !== undefined) updateData.severity = data.severity;
    if (data.risk_score !== undefined) updateData.risk_score = data.risk_score;

    return alertRepository.update(id, updateData);
  }

  async updateAlertStatus(id: number, status: AlertStatus) {
    return this.updateAlert(id, { status });
  }
}

export default new AlertService();
