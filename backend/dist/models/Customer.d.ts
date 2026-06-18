import { RiskCategory } from '../types';
import { Account } from './Account';
import { Alert } from './Alert';
export declare class Customer {
    id: number;
    customer_number: string;
    name: string;
    dob: string | null;
    address: string | null;
    pan: string | null;
    aadhaar: string | null;
    occupation: string | null;
    country: string;
    is_pep: boolean;
    risk_score: number;
    risk_category: RiskCategory;
    created_at: Date;
    accounts?: Account[];
    alerts?: Alert[];
}
export type CustomerCreationAttributes = Partial<Pick<Customer, 'dob' | 'address' | 'pan' | 'aadhaar' | 'occupation' | 'country' | 'is_pep' | 'risk_score' | 'risk_category'>> & Pick<Customer, 'customer_number' | 'name'>;
export default Customer;
//# sourceMappingURL=Customer.d.ts.map