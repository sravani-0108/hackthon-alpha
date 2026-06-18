"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transactionAnalysisTool = void 0;
const adk_1 = require("@google/adk");
const zod_1 = require("zod");
const transactionAgent_1 = __importDefault(require("../../services/agents/transactionAgent"));
exports.transactionAnalysisTool = new adk_1.FunctionTool({
    name: 'transaction_analysis',
    description: 'Analyze the flagged transaction for velocity, spike multiplier, and recent transaction patterns from the bank database.',
    parameters: zod_1.z.object({
        alert_id: zod_1.z.number().describe('Alert ID'),
        customer_id: zod_1.z.number().describe('Customer ID linked to the alert'),
    }),
    execute: async ({ alert_id, customer_id }) => transactionAgent_1.default.analyze(alert_id, customer_id),
});
//# sourceMappingURL=transactionAnalysisTool.js.map