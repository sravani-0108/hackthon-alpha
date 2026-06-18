import { TransactionType, TransactionStatus } from '../types';
import { Account } from './Account';
import { Alert } from './Alert';
export declare class Transaction {
    id: number;
    account_id: number;
    amount: number;
    transaction_type: TransactionType;
    sender_account: string | null;
    receiver_account: string | null;
    country: string | null;
    transaction_date: Date;
    status: TransactionStatus;
    account?: Account;
    alerts?: Alert[];
}
export type TransactionCreationAttributes = Pick<Transaction, 'account_id' | 'amount' | 'transaction_type' | 'transaction_date'> & Partial<Pick<Transaction, 'sender_account' | 'receiver_account' | 'country' | 'status'>>;
export default Transaction;
//# sourceMappingURL=Transaction.d.ts.map