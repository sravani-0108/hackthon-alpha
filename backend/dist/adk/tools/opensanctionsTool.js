"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.opensanctionsTool = void 0;
exports.resolveCustomerName = resolveCustomerName;
const adk_1 = require("@google/adk");
const zod_1 = require("zod");
const customerRepository_1 = __importDefault(require("../../repositories/customerRepository"));
const database_1 = require("../../config/database");
const Account_1 = require("../../models/Account");
const Transaction_1 = require("../../models/Transaction");
const highRiskCountryService_1 = __importDefault(require("../../services/highRiskCountryService"));
async function matchOpenSanctions(entityName) {
    const response = await fetch('https://api.opensanctions.org/match/default?algorithm=best', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
        body: JSON.stringify({
            queries: {
                q1: {
                    schema: 'Person',
                    properties: { name: [entityName] },
                },
            },
        }),
    });
    if (!response.ok) {
        const body = await response.text();
        throw new Error(`OpenSanctions API error ${response.status}: ${body.slice(0, 200)}`);
    }
    const apiResult = (await response.json());
    const results = apiResult.responses?.q1?.results ?? [];
    const matches = results
        .filter((r) => (r.score ?? 0) >= 0.7 || r.match)
        .map((r) => ({
        name: r.properties?.name?.[0] ?? entityName,
        datasets: r.datasets ?? [],
        score: r.score ?? 0,
    }));
    const matchedLists = [...new Set(matches.flatMap((m) => m.datasets))];
    return {
        matched: matches.length > 0,
        match_score: matches[0]?.score ?? 0,
        matched_lists: matchedLists,
        entities: matches,
        source: 'opensanctions',
        entity_name: entityName,
    };
}
async function getHighRiskCountryTxnCount(customerId) {
    const highRiskCountries = await highRiskCountryService_1.default.getCountries();
    const accounts = await database_1.AppDataSource.getRepository(Account_1.Account).find({ where: { customer_id: customerId } });
    const accountIds = accounts.map((a) => a.id);
    if (!accountIds.length)
        return 0;
    const txns = await database_1.AppDataSource.getRepository(Transaction_1.Transaction)
        .createQueryBuilder('t')
        .where('t.account_id IN (:...accountIds)', { accountIds })
        .getMany();
    return txns.filter((t) => t.country &&
        highRiskCountries.has(t.country.trim().toLowerCase())).length;
}
exports.opensanctionsTool = new adk_1.FunctionTool({
    name: 'opensanctions_lookup',
    description: 'Screen a person against live OpenSanctions watchlists (OFAC, UN, EU, PEP datasets). Returns real API matches only.',
    parameters: zod_1.z.object({
        entity_name: zod_1.z.string().describe('Full name of person or entity to screen'),
        check_type: zod_1.z.enum(['sanctions', 'pep']).describe('sanctions = watchlists; pep = politically exposed persons'),
        customer_id: zod_1.z.number().optional().describe('Customer ID for geographic risk context from bank DB'),
    }),
    execute: async ({ entity_name, check_type, customer_id }) => {
        const result = await matchOpenSanctions(entity_name);
        if (customer_id) {
            const customer = await customerRepository_1.default.findById(customer_id);
            const highRiskCountryTransactions = await getHighRiskCountryTxnCount(customer_id);
            return {
                ...result,
                check_type,
                customer_country: customer?.country ?? null,
                is_kyc_pep: customer?.is_pep ?? false,
                high_risk_country_transactions: highRiskCountryTransactions,
            };
        }
        return { ...result, check_type };
    },
});
async function resolveCustomerName(customerId) {
    const customer = await customerRepository_1.default.findById(customerId);
    return customer?.name ?? 'Unknown';
}
//# sourceMappingURL=opensanctionsTool.js.map