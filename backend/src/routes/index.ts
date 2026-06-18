import { Router } from 'express';
import authRoutes from './authRoutes';
import dashboardRoutes from './dashboardRoutes';
import customerRoutes from './customerRoutes';
import transactionRoutes from './transactionRoutes';
import alertRoutes from './alertRoutes';
import investigationRoutes from './investigationRoutes';
import agentRoutes from './agentRoutes';
import caseRoutes from './caseRoutes';
import systemRoutes from './systemRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/customers', customerRoutes);
router.use('/transactions', transactionRoutes);
router.use('/alerts', alertRoutes);
router.use('/investigations', investigationRoutes);
router.use('/agents', agentRoutes);
router.use('/cases', caseRoutes);
router.use('/system', systemRoutes);

export default router;
