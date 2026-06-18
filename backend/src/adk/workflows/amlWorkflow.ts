import { ParallelAgent, SequentialAgent } from '@google/adk';
import { profileAgent } from '../agents/profileAgent';
import { sanctionsAgent } from '../agents/sanctionsAgent';
import { investigationAgent } from '../agents/investigationAgent';
import { evidenceSubWorkflow } from './evidenceSubWorkflow';

const screeningParallel = new ParallelAgent({
  name: 'screening_parallel',
  description: 'Customer profile and sanctions screening in parallel.',
  subAgents: [profileAgent, sanctionsAgent],
});

export const amlWorkflow = new SequentialAgent({
  name: 'aml_triage_workflow',
  description: 'Root AML triage: parallel screening, parallel evidence, then investigation synthesis.',
  subAgents: [screeningParallel, evidenceSubWorkflow, investigationAgent],
});
