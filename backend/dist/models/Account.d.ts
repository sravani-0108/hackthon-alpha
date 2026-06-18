import { AccountType } from '../types';
import { Customer } from './Customer';
import { Transaction } from './Transaction';
export declare class Account {
    id: number;
    customer_id: number;
    account_number: string;
    account_type: AccountType;
    balance: number;
    opened_at: Date;
    customer?: Customer;
    transactions?: Transaction[];
}
export type AccountCreationAttributes = Pick<Account, 'customer_id' | 'account_number'> & Partial<Pick<Account, 'account_type' | 'balance'>>;
export default Account;
//# sourceMappingURL=Account.d.ts.map