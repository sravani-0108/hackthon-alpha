import { Brackets, In } from 'typeorm';
import { AppDataSource } from '../config/database';
import { applyQueryPagination } from '../utils/pagination';
import { Alert, AlertCreationAttributes } from '../models/Alert';
import { AlertSeverity, AlertStatus } from '../types';

interface FindAllParams {
  offset: number;
  limit: number | null;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
  status?: AlertStatus;
  severity?: AlertSeverity;
  alertType?: string;
}

class AlertRepository {
  private repo() {
    return AppDataSource.getRepository(Alert);
  }

  async findAll({ offset, limit, search, sortBy, sortOrder, status, severity, alertType }: FindAllParams) {
    const sortField = sortBy || 'created_at';
    const order = (sortOrder || 'DESC').toUpperCase() as 'ASC' | 'DESC';

    const qb = applyQueryPagination(
      this.repo()
        .createQueryBuilder('alert')
        .leftJoinAndSelect('alert.customer', 'customer')
        .leftJoinAndSelect('alert.transaction', 'transaction'),
      offset,
      limit
    ).orderBy(`alert.${sortField}`, order);

    if (status) qb.andWhere('alert.status = :status', { status });
    if (severity) qb.andWhere('alert.severity = :severity', { severity });
    if (alertType) qb.andWhere('alert.alert_type = :alertType', { alertType });

    if (search) {
      qb.andWhere(
        new Brackets((sub) => {
          sub
            .where('customer.name ILIKE :search', { search: `%${search}%` })
            .orWhere('customer.customer_number ILIKE :search', { search: `%${search}%` });
        })
      );
    }

    const [rows, count] = await qb.getManyAndCount();
    return { count, rows };
  }

  async findById(id: number): Promise<Alert | null> {
    return this.repo().findOne({
      where: { id },
      relations: { customer: { accounts: true }, transaction: true },
    });
  }

  async create(alertData: AlertCreationAttributes): Promise<Alert> {
    const alert = this.repo().create(alertData);
    return this.repo().save(alert);
  }

  async update(id: number, updateData: Partial<AlertCreationAttributes>): Promise<Alert | null> {
    const alert = await this.repo().findOne({ where: { id } });
    if (!alert) return null;

    Object.assign(alert, updateData);
    return this.repo().save(alert);
  }

  async countByStatus(status: AlertStatus): Promise<number> {
    return this.repo().count({ where: { status } });
  }

  async countOpen(): Promise<number> {
    return this.repo().count({
      where: { status: 'Open' },
    });
  }

  async countHighAndCritical(): Promise<number> {
    return this.repo().count({
      where: { severity: In(['High', 'Critical']) },
    });
  }

  async countAll(): Promise<number> {
    return this.repo().count();
  }
}

export default new AlertRepository();
