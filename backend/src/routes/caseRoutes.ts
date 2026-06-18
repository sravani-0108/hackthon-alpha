import { Router } from 'express';
import * as caseController from '../controllers/caseController';
import { authenticate } from '../middlewares/auth';
import { authorize, ROLES } from '../middlewares/rbac';

const router = Router();

router.get('/', authenticate, authorize(ROLES.BANK_MANAGER, ROLES.ADMIN), caseController.getCases);
router.get('/:id', authenticate, authorize(ROLES.BANK_MANAGER, ROLES.ADMIN), caseController.getCaseById);
router.put('/:id/assign', authenticate, authorize(ROLES.BANK_MANAGER, ROLES.ADMIN), caseController.assignCase);
router.put('/:id/close', authenticate, authorize(ROLES.BANK_MANAGER, ROLES.ADMIN), caseController.closeCase);
router.put('/:id/resolve', authenticate, authorize(ROLES.BANK_MANAGER, ROLES.ADMIN), caseController.resolveCase);

export default router;
