import { Transaction } from '../models/Transaction';
import { Alert } from '../models/Alert';
declare class AmlRulesEngine {
    evaluateTransaction(transaction: Transaction): Promise<Alert[]>;
}
declare const _default: AmlRulesEngine;
export default _default;
//# sourceMappingURL=amlRulesEngine.d.ts.map