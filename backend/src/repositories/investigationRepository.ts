import { AppDataSource } from '../config/database';
import { Investigation, InvestigationCreationAttributes } from '../models/Investigation';
import { InvestigationStatus } from '../types';

interface FindAllParams {
  offset: number;
  limit: number | null;
  status?: InvestigationStatus;
  managerId?: number;
}

class InvestigationRepository {
  private repo() {
    return AppDataSource.getRepository(Investigation);
  }

  async create(data: InvestigationCreationAttributes): Promise<Investigation> {
    const investigation = this.repo().create(data);
    return this.repo().save(investigation);
  }

  async findById(id: number): Promise<Investigation | null> {
    return this.repo().findOne({
      where: { id },
      relations: { alert: { customer: true }, manager: true },
      select: {
        manager: { id: true, name: true, email: true },
      },
    });
  }

  async update(id: number, data: Partial<InvestigationCreationAttributes>): Promise<Investigation | null> {
    const investigation = await this.repo().findOne({ where: { id } });
    if (!investigation) return null;

    Object.assign(investigation, data);
    await this.repo().save(investigation);
    return this.findById(id);
  }

  async findAll({ offset, limit, status, managerId }: FindAllParams) {
    const where: { status?: InvestigationStatus; manager_id?: number } = {};
    if (status) where.status = status;
    if (managerId) where.manager_id = managerId;

    const [rows, count] = await this.repo().findAndCount({
      where: Object.keys(where).length ? where : undefined,
      relations: { alert: { customer: true }, manager: true },
      select: {
        alert: { id: true, alert_type: true, status: true, customer: { id: true, name: true, customer_number: true } },
        manager: { id: true, name: true, email: true },
      },
      order: { created_at: 'DESC' },
      ...(limit != null ? { skip: offset, take: limit } : {}),
    });

    return { count, rows };
  }

  async findByAlertId(alertId: number): Promise<Investigation | null> {
    return this.repo().findOne({
      where: { alert_id: alertId },
      order: { created_at: 'DESC' },
    });
  }
}

export default new InvestigationRepository();
