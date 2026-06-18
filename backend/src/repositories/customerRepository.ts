import { Brackets, In } from 'typeorm';
import { AppDataSource } from '../config/database';
import { applyQueryPagination } from '../utils/pagination';
import { Customer } from '../models/Customer';
import { Transaction } from '../models/Transaction';
import { RiskCategory } from '../types';

interface FindAllParams {
  offset: number;
  limit: number | null;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
  riskCategory?: RiskCategory;
}

class CustomerRepository {
  private repo() {
    return AppDataSource.getRepository(Customer);
  }

  async findAll({ offset, limit, search, sortBy, sortOrder, riskCategory }: FindAllParams) {
    const sortField = sortBy || 'created_at';
    const order = (sortOrder || 'DESC').toUpperCase() as 'ASC' | 'DESC';

    const qb = applyQueryPagination(
      this.repo()
        .createQueryBuilder('customer')
        .select([
          'customer.id',
          'customer.customer_number',
          'customer.name',
          'customer.dob',
          'customer.address',
          'customer.pan',
          'customer.occupation',
          'customer.country',
          'customer.is_pep',
          'customer.risk_score',
          'customer.risk_category',
          'customer.created_at',
        ]),
      offset,
      limit
    ).orderBy(`customer.${sortField}`, order);

    if (search) {
      qb.andWhere(
        new Brackets((sub) => {
          sub
            .where('customer.name ILIKE :search', { search: `%${search}%` })
            .orWhere('customer.customer_number ILIKE :search', { search: `%${search}%` })
            .orWhere('customer.pan ILIKE :search', { search: `%${search}%` });
        })
      );
    }

    if (riskCategory) {
      qb.andWhere('customer.risk_category = :riskCategory', { riskCategory });
    }

    const [rows, count] = await qb.getManyAndCount();
    return { count, rows };
  }

  async findById(id: number): Promise<Customer | null> {
    return this.repo().findOne({
      where: { id },
      relations: ['accounts', 'alerts'],
      select: {
        id: true,
        customer_number: true,
        name: true,
        dob: true,
        address: true,
        pan: true,
        aadhaar: true,
        occupation: true,
        country: true,
        is_pep: true,
        risk_score: true,
        risk_category: true,
        created_at: true,
        accounts: true,
        alerts: { id: true, status: true },
      },
    });
  }

  async findByIdWithTransactions(id: number, transactionLimit: number | null = null) {
    const customer = await this.findById(id);
    if (!customer) return null;

    const accountIds = customer.accounts?.map((a) => a.id) ?? [];

    let recentTransactions: Transaction[] = [];
    if (accountIds.length > 0) {
      recentTransactions = await AppDataSource.getRepository(Transaction).find({
        where: { account_id: In(accountIds) },
        order: { transaction_date: 'DESC' },
        ...(transactionLimit != null ? { take: transactionLimit } : {}),
      });
    }

    return { customer, recentTransactions };
  }

  async updateRiskScore(id: number, riskScore: number, riskCategory: RiskCategory): Promise<Customer | null> {
    const customer = await this.repo().findOne({ where: { id } });
    if (!customer) return null;

    customer.risk_score = riskScore;
    customer.risk_category = riskCategory;
    return this.repo().save(customer);
  }

  async countHighRisk(): Promise<number> {
    return this.repo().count({ where: { risk_category: 'High' } });
  }

  async countAll(): Promise<number> {
    return this.repo().count();
  }
}

export default new CustomerRepository();
