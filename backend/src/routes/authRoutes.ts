import { Router } from 'express';
import * as authController from '../controllers/authController';
import { registerValidation, loginValidation } from '../validations/authValidation';
import validate from '../middlewares/validate';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.post('/register', registerValidation, validate, authController.register);
router.post('/login', loginValidation, validate, authController.login);
router.post('/logout', authenticate, authController.logout);
router.post('/refresh-token', authController.refreshToken);

export default router;
