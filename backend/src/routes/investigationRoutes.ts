import { Router } from 'express';
import * as investigationController from '../controllers/investigationController';
import { authenticate } from '../middlewares/auth';
import { authorize, ROLES } from '../middlewares/rbac';
import { createInvestigationValidation, updateInvestigationValidation } from '../validations/investigationValidation';
import validate from '../middlewares/validate';

const router = Router();

router.get('/', authenticate, authorize(ROLES.BANK_MANAGER, ROLES.ADMIN), investigationController.getInvestigations);
router.post('/start/:alertId', authenticate, authorize(ROLES.BANK_MANAGER, ROLES.ADMIN), investigationController.startInvestigation);
router.get('/:id', authenticate, authorize(ROLES.BANK_MANAGER, ROLES.ADMIN), investigationController.getInvestigationById);
router.get('/:id/report', authenticate, authorize(ROLES.BANK_MANAGER, ROLES.ADMIN), investigationController.getInvestigationReport);
router.post('/', authenticate, authorize(ROLES.BANK_MANAGER, ROLES.ADMIN), createInvestigationValidation, validate, investigationController.createInvestigation);
router.put('/:id', authenticate, authorize(ROLES.BANK_MANAGER, ROLES.ADMIN), updateInvestigationValidation, validate, investigationController.updateInvestigation);

export default router;
