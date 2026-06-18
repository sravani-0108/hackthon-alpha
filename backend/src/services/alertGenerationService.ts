import alertRepository from '../repositories/alertRepository';
import { AlertSeverity, AlertStatus, CreateAlertInput } from '../types';
import { Alert } from '../models/Alert';

class AlertGenerationService {
  async createAlert({
    customerId,
    transactionId,
    alertType,
    riskScore,
    severity,
    status = 'Open',
  }: CreateAlertInput & { status?: AlertStatus; severity?: AlertSeverity }): Promise<Alert> {
    return alertRepository.create({
      customer_id: customerId,
      transaction_id: transactionId ?? null,
      alert_type: alertType,
      risk_score: riskScore ?? 0,
      severity: severity ?? 'Medium',
      status,
    });
  }
}

export default new AlertGenerationService();
