import { Router } from 'express';
import * as agentController from '../controllers/agentController';
import { authenticate } from '../middlewares/auth';
import { authorize, ROLES } from '../middlewares/rbac';

const router = Router();

router.post('/customer-analysis', authenticate, authorize(ROLES.BANK_MANAGER, ROLES.ADMIN), agentController.customerAnalysis);
router.post('/transaction-analysis', authenticate, authorize(ROLES.BANK_MANAGER, ROLES.ADMIN), agentController.transactionAnalysis);
router.post('/sanctions-check', authenticate, authorize(ROLES.BANK_MANAGER, ROLES.ADMIN), agentController.sanctionsCheck);
router.post('/pep-check', authenticate, authorize(ROLES.BANK_MANAGER, ROLES.ADMIN), agentController.pepCheck);
router.post('/media-analysis', authenticate, authorize(ROLES.BANK_MANAGER, ROLES.ADMIN), agentController.mediaAnalysis);
router.post('/final-decision', authenticate, authorize(ROLES.BANK_MANAGER, ROLES.ADMIN), agentController.finalDecision);

export default router;
