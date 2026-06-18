import { Router } from 'express';
import * as transactionController from '../controllers/transactionController';
import { authenticate } from '../middlewares/auth';
import { authorize, ROLES } from '../middlewares/rbac';

const router = Router();

/**
 * @swagger
 * /transactions:
 *   get:
 *     summary: List transactions with filters
 *     tags: [Transactions]
 */
router.get('/', authenticate, authorize(ROLES.BANK_MANAGER, ROLES.ADMIN), transactionController.getTransactions);

/**
 * @swagger
 * /transactions/customer/{customerId}:
 *   get:
 *     summary: Get transactions for a specific customer
 *     tags: [Transactions]
 */
router.get(
  '/customer/:customerId',
  authenticate,
  authorize(ROLES.BANK_MANAGER, ROLES.ADMIN),
  transactionController.getTransactionsByCustomer
);

export default router;
