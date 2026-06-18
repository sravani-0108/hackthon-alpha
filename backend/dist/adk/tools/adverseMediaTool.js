"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adverseMediaTool = void 0;
const adk_1 = require("@google/adk");
const zod_1 = require("zod");
const customerRepository_1 = __importDefault(require("../../repositories/customerRepository"));
/** Only registered when USE_MOCK_SCREENING=true — live mode uses GOOGLE_SEARCH only. */
exports.adverseMediaTool = new adk_1.FunctionTool({
    name: 'adverse_media_lookup',
    description: 'Offline mock adverse media lookup (demo mode only).',
    parameters: zod_1.z.object({
        customer_id: zod_1.z.number().describe('Customer ID'),
    }),
    execute: async ({ customer_id }) => {
        const customer = await customerRepository_1.default.findById(customer_id);
        if (!customer)
            throw new Error('Customer not found');
        return {
            negativeNews: false,
            articleCount: 0,
            articles: [],
            summary: `Mock mode: no seeded adverse media for ${customer.name}. Use live Google Search instead.`,
            source: 'mock',
        };
    },
});
//# sourceMappingURL=adverseMediaTool.js.map