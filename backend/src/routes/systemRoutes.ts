import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import { authorize, ROLES } from '../middlewares/rbac';
import { getSystemMode } from '../adk/utils';

const router = Router();

router.get('/mode', authenticate, authorize(ROLES.BANK_MANAGER, ROLES.ADMIN), (_req, res) => {
  res.json({ success: true, message: 'System mode', data: getSystemMode() });
});

export default router;
