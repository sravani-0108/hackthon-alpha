import { Transaction, TransactionCreationAttributes } from '../models/Transaction';
import { TransactionType } from '../types';
interface TransactionFilterParams {
    offset: number;
    limit: number | null;
    startDate?: string;
    endDate?: string;
    minAmount?: number;
    maxAmount?: number;
    transactionType?: TransactionType;
}
declare class TransactionRepository {
    private repo;
    private buildWhere;
    findAll(params: TransactionFilterParams): Promise<{
        count: number;
        rows: Transaction[];
    }>;
    findByCustomerId(customerId: number, params: TransactionFilterParams): Promise<{
        count: number;
        rows: Transaction[];
    }>;
    findById(id: number): Promise<Transaction | null>;
    create(transactionData: TransactionCreationAttributes): Promise<Transaction>;
    countAll(): Promise<number>;
    countInTimeWindow(accountIds: number[], hours: number, beforeDate: Date): Promise<number>;
    countStructuringTransactions(accountIds: number[], maxAmount: number, hours: number, beforeDate: Date): Promise<number>;
    getMonthlyVolume(accountIds: number[], year: number, month: number): Promise<number>;
    getAverageMonthlyVolume(accountIds: number[], beforeDate: Date, excludeTransactionId?: number): Promise<number>;
    getMonthlyVolumeExcludingTransaction(accountIds: number[], year: number, month: number, excludeTransactionId?: number): Promise<number>;
}
declare const _default: TransactionRepository;
export default _default;
//# sourceMappingURL=transactionRepository.d.ts.map