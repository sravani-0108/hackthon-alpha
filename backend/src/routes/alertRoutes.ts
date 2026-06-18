import { Router } from 'express';
import * as alertController from '../controllers/alertController';
import { authenticate } from '../middlewares/auth';
import { authorize, ROLES } from '../middlewares/rbac';
import { createAlertValidation, updateAlertValidation } from '../validations/alertValidation';
import validate from '../middlewares/validate';

const router = Router();

router.get('/', authenticate, authorize(ROLES.BANK_MANAGER, ROLES.ADMIN), alertController.getAlerts);
router.get('/:id', authenticate, authorize(ROLES.BANK_MANAGER, ROLES.ADMIN), alertController.getAlertById);
router.post('/', authenticate, authorize(ROLES.BANK_MANAGER, ROLES.ADMIN), createAlertValidation, validate, alertController.createAlert);
router.put('/:id', authenticate, authorize(ROLES.BANK_MANAGER, ROLES.ADMIN), updateAlertValidation, validate, alertController.updateAlert);
router.put('/:id/status', authenticate, authorize(ROLES.BANK_MANAGER, ROLES.ADMIN), alertController.updateAlertStatus);

export default router;
