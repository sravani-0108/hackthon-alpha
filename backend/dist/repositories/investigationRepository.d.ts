import { Investigation, InvestigationCreationAttributes } from '../models/Investigation';
import { InvestigationStatus } from '../types';
interface FindAllParams {
    offset: number;
    limit: number | null;
    status?: InvestigationStatus;
    managerId?: number;
}
declare class InvestigationRepository {
    private repo;
    create(data: InvestigationCreationAttributes): Promise<Investigation>;
    findById(id: number): Promise<Investigation | null>;
    update(id: number, data: Partial<InvestigationCreationAttributes>): Promise<Investigation | null>;
    findAll({ offset, limit, status, managerId }: FindAllParams): Promise<{
        count: number;
        rows: Investigation[];
    }>;
    findByAlertId(alertId: number): Promise<Investigation | null>;
}
declare const _default: InvestigationRepository;
export default _default;
//# sourceMappingURL=investigationRepository.d.ts.map