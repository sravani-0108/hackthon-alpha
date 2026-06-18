import customerRepository from '../repositories/customerRepository';
import alertRepository from '../repositories/alertRepository';

class DashboardService {
  async getStats() {
    const [totalCustomers, highRisk, openAlerts, totalAlerts, recentAlertsResult] = await Promise.all([
      customerRepository.countAll(),
      alertRepository.countHighAndCritical(),
      alertRepository.countOpen(),
      alertRepository.countAll(),
      alertRepository.findAll({ offset: 0, limit: null }),
    ]);

    return {
      totalCustomers,
      totalAlerts,
      openAlerts,
      highRisk,
      recentAlerts: recentAlertsResult.rows,
    };
  }
}

export default new DashboardService();
