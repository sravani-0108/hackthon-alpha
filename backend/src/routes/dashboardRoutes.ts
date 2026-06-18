import { Router } from 'express';
import * as dashboardController from '../controllers/dashboardController';
import { authenticate } from '../middlewares/auth';
import { authorize, ROLES } from '../middlewares/rbac';

const router = Router();

/**
 * @swagger
 * /dashboard/stats:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [Dashboard]
 */
router.get('/stats', authenticate, authorize(ROLES.BANK_MANAGER, ROLES.ADMIN), dashboardController.getStats);

export default router;
