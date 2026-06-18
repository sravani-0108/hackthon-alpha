"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.customerLookupTool = void 0;
const adk_1 = require("@google/adk");
const zod_1 = require("zod");
const customerAgent_1 = __importDefault(require("../../services/agents/customerAgent"));
exports.customerLookupTool = new adk_1.FunctionTool({
    name: 'customer_lookup',
    description: 'Retrieve customer KYC profile, account age, balances, and risk classification from the bank database.',
    parameters: zod_1.z.object({
        customer_id: zod_1.z.number().describe('Internal customer ID'),
    }),
    execute: async ({ customer_id }) => customerAgent_1.default.analyze(customer_id),
});
//# sourceMappingURL=customerLookupTool.js.map