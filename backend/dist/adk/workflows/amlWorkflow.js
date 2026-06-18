"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.amlWorkflow = void 0;
const adk_1 = require("@google/adk");
const profileAgent_1 = require("../agents/profileAgent");
const sanctionsAgent_1 = require("../agents/sanctionsAgent");
const investigationAgent_1 = require("../agents/investigationAgent");
const evidenceSubWorkflow_1 = require("./evidenceSubWorkflow");
const screeningParallel = new adk_1.ParallelAgent({
    name: 'screening_parallel',
    description: 'Customer profile and sanctions screening in parallel.',
    subAgents: [profileAgent_1.profileAgent, sanctionsAgent_1.sanctionsAgent],
});
exports.amlWorkflow = new adk_1.SequentialAgent({
    name: 'aml_triage_workflow',
    description: 'Root AML triage: parallel screening, parallel evidence, then investigation synthesis.',
    subAgents: [screeningParallel, evidenceSubWorkflow_1.evidenceSubWorkflow, investigationAgent_1.investigationAgent],
});
//# sourceMappingURL=amlWorkflow.js.map