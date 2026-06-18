import customerRepository from '../repositories/customerRepository';
import { getPaginationParams, buildPaginationMeta } from '../utils/pagination';
import { AppError, QueryFilters } from '../types';

class CustomerService {
  async getCustomers(query: QueryFilters) {
    const { page, limit, offset } = getPaginationParams(query);

    const { count, rows } = await customerRepository.findAll({
      offset,
      limit,
      search: query.search,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder?.toUpperCase(),
      riskCategory: query.riskCategory,
    });

    return { customers: rows, pagination: buildPaginationMeta(count, page, limit) };
  }

  async getCustomerById(id: number) {
    const result = await customerRepository.findByIdWithTransactions(id);
    if (!result) {
      const error = new Error('Customer not found.') as AppError;
      error.statusCode = 404;
      throw error;
    }

    const { customer, recentTransactions } = result;
    const openAlertCount = customer.alerts?.filter((a) => a.status !== 'Closed').length ?? 0;

    return {
      profile: {
        id: customer.id,
        customer_number: customer.customer_number,
        name: customer.name,
        dob: customer.dob,
        address: customer.address,
        pan: customer.pan,
        occupation: customer.occupation,
        created_at: customer.created_at,
      },
      accounts: customer.accounts,
      riskInformation: {
        risk_score: customer.risk_score,
        risk_category: customer.risk_category,
      },
      alertCount: {
        total: customer.alerts?.length ?? 0,
        open: openAlertCount,
      },
      recentTransactions,
    };
  }

  async getCustomerTransactions(id: number, limit: number | null = null) {
    const result = await customerRepository.findByIdWithTransactions(id, limit);
    if (!result) {
      const error = new Error('Customer not found.') as AppError;
      error.statusCode = 404;
      throw error;
    }
    return result.recentTransactions;
  }

  async getCustomerRiskProfile(id: number) {
    const customer = await customerRepository.findById(id);
    if (!customer) {
      const error = new Error('Customer not found.') as AppError;
      error.statusCode = 404;
      throw error;
    }

    const openAlerts = customer.alerts?.filter((a) => !['Closed', 'Cleared'].includes(a.status)).length ?? 0;

    return {
      customerId: customer.id,
      customerName: customer.name,
      customerRisk: customer.risk_category,
      riskScore: customer.risk_score,
      country: customer.country,
      occupation: customer.occupation,
      isPep: customer.is_pep,
      openAlerts,
      accountCount: customer.accounts?.length ?? 0,
    };
  }
}

export default new CustomerService();
