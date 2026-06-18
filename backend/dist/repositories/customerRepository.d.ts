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
declare class CustomerRepository {
    private repo;
    findAll({ offset, limit, search, sortBy, sortOrder, riskCategory }: FindAllParams): Promise<{
        count: number;
        rows: Customer[];
    }>;
    findById(id: number): Promise<Customer | null>;
    findByIdWithTransactions(id: number, transactionLimit?: number | null): Promise<{
        customer: Customer;
        recentTransactions: Transaction[];
    } | null>;
    updateRiskScore(id: number, riskScore: number, riskCategory: RiskCategory): Promise<Customer | null>;
    countHighRisk(): Promise<number>;
    countAll(): Promise<number>;
}
declare const _default: CustomerRepository;
export default _default;
//# sourceMappingURL=customerRepository.d.ts.map