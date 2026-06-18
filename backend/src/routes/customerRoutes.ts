import { Router } from 'express';
import * as customerController from '../controllers/customerController';
import { authenticate } from '../middlewares/auth';
import { authorize, ROLES } from '../middlewares/rbac';

const router = Router();

router.get('/', authenticate, authorize(ROLES.BANK_MANAGER, ROLES.ADMIN), customerController.getCustomers);
router.get('/:id', authenticate, authorize(ROLES.BANK_MANAGER, ROLES.ADMIN), customerController.getCustomerById);
router.get('/:id/transactions', authenticate, authorize(ROLES.BANK_MANAGER, ROLES.ADMIN), customerController.getCustomerTransactions);
router.get('/:id/risk-profile', authenticate, authorize(ROLES.BANK_MANAGER, ROLES.ADMIN), customerController.getCustomerRiskProfile);

export default router;
