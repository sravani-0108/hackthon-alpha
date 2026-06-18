import { ParallelAgent } from '@google/adk';
import { transactionAgent } from '../agents/transactionAgent';
import { pepAgent } from '../agents/pepAgent';
import { adverseMediaAgent } from '../agents/adverseMediaAgent';

export const evidenceSubWorkflow = new ParallelAgent({
  name: 'evidence_sub_workflow',
  description: 'Runs transaction, PEP, and adverse media analysis in parallel.',
  subAgents: [transactionAgent, pepAgent, adverseMediaAgent],
});
