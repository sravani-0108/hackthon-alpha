import { QueryFilters } from '../types';
import { TransactionCreationAttributes } from '../models/Transaction';
declare class TransactionService {
    getTransactions(query: QueryFilters): Promise<{
        transactions: import("../models/Transaction").Transaction[];
        pagination: import("../types").PaginationMeta;
    }>;
    getTransactionsByCustomer(customerId: number, query: QueryFilters): Promise<{
        transactions: import("../models/Transaction").Transaction[];
        pagination: import("../types").PaginationMeta;
    }>;
    processTransaction(transactionData: TransactionCreationAttributes): Promise<{
        transaction: import("../models/Transaction").Transaction;
        alerts: import("../models").Alert[];
    }>;
}
declare const _default: TransactionService;
export default _default;
//# sourceMappingURL=transactionService.d.ts.map