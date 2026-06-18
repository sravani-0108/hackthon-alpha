import transactionRepository from '../repositories/transactionRepository';
import customerRepository from '../repositories/customerRepository';
import amlRulesEngine from './amlRulesEngine';
import { getPaginationParams, buildPaginationMeta } from '../utils/pagination';
import { AppError, QueryFilters } from '../types';
import { TransactionCreationAttributes } from '../models/Transaction';

class TransactionService {
  async getTransactions(query: QueryFilters) {
    const { page, limit, offset } = getPaginationParams(query);

    const { count, rows } = await transactionRepository.findAll({
      offset,
      limit,
      startDate: query.startDate,
      endDate: query.endDate,
      minAmount: query.minAmount ? parseFloat(query.minAmount) : undefined,
      maxAmount: query.maxAmount ? parseFloat(query.maxAmount) : undefined,
      transactionType: query.transactionType,
    });

    return { transactions: rows, pagination: buildPaginationMeta(count, page, limit) };
  }

  async getTransactionsByCustomer(customerId: number, query: QueryFilters) {
    const customer = await customerRepository.findById(customerId);
    if (!customer) {
      const error = new Error('Customer not found.') as AppError;
      error.statusCode = 404;
      throw error;
    }

    const { page, limit, offset } = getPaginationParams(query);

    const { count, rows } = await transactionRepository.findByCustomerId(customerId, {
      offset,
      limit,
      startDate: query.startDate,
      endDate: query.endDate,
      minAmount: query.minAmount ? parseFloat(query.minAmount) : undefined,
      maxAmount: query.maxAmount ? parseFloat(query.maxAmount) : undefined,
      transactionType: query.transactionType,
    });

    return { transactions: rows, pagination: buildPaginationMeta(count, page, limit) };
  }

  async processTransaction(transactionData: TransactionCreationAttributes) {
    const transaction = await transactionRepository.create(transactionData);
    const alerts = await amlRulesEngine.evaluateTransaction(transaction);
    return { transaction, alerts };
  }
}

export default new TransactionService();
