"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evidenceSubWorkflow = void 0;
const adk_1 = require("@google/adk");
const transactionAgent_1 = require("../agents/transactionAgent");
const pepAgent_1 = require("../agents/pepAgent");
const adverseMediaAgent_1 = require("../agents/adverseMediaAgent");
exports.evidenceSubWorkflow = new adk_1.ParallelAgent({
    name: 'evidence_sub_workflow',
    description: 'Runs transaction, PEP, and adverse media analysis in parallel.',
    subAgents: [transactionAgent_1.transactionAgent, pepAgent_1.pepAgent, adverseMediaAgent_1.adverseMediaAgent],
});
//# sourceMappingURL=evidenceSubWorkflow.js.map