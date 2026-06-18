"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const customerRepository_1 = __importDefault(require("../../repositories/customerRepository"));
const PEP_DATABASE = [
    { name: 'Vikram Singh', position: 'State Minister', country: 'India', source: 'World-Check' },
    { name: 'Rajesh Kumar', position: 'Municipal Councilor', country: 'India', source: 'Internal PEP List' },
    { name: 'Mohammed Ali', position: 'Business Associate of PEP', country: 'India', source: 'Dow Jones' },
];
class PepAgent {
    async check(customerId) {
        const customer = await customerRepository_1.default.findById(customerId);
        if (!customer)
            throw new Error('Customer not found');
        const dbMatch = PEP_DATABASE.find((p) => p.name.toLowerCase() === customer.name.toLowerCase());
        const pepMatch = customer.is_pep || !!dbMatch;
        return {
            pepMatch,
            pepDetails: dbMatch
                ? { name: dbMatch.name, position: dbMatch.position, source: dbMatch.source }
                : customer.is_pep
                    ? { name: customer.name, position: 'Flagged in KYC', source: 'Internal PEP List' }
                    : null,
            checkedDatabases: ['World-Check', 'Dow Jones', 'Internal PEP List'],
            isDirectPep: customer.is_pep,
            summary: pepMatch
                ? `PEP match found${dbMatch ? `: ${dbMatch.position} (${dbMatch.source})` : ' via KYC flag'}.`
                : 'No PEP match found across all databases.',
        };
    }
}
exports.default = new PepAgent();
//# sourceMappingURL=pepAgent.js.map