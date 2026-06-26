import { Router } from 'express';
import * as auth from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import {
  registerRules,
  loginRules,
  forgotPasswordRules,
  resetPasswordRules,
  changePasswordRules,
} from '../validators/authValidator.js';

const router = Router();

router.post('/register', authLimiter, validate(registerRules), auth.register);
router.post('/login', authLimiter, validate(loginRules), auth.login);
router.post('/refresh', auth.refresh);
router.post('/forgot-password', authLimiter, validate(forgotPasswordRules), auth.forgotPassword);
router.patch('/reset-password/:token', validate(resetPasswordRules), auth.resetPassword);

router.use(protect);
router.post('/logout', auth.logout);
router.get('/me', auth.getMe);
router.patch('/me', auth.updateMe);
router.patch('/change-password', validate(changePasswordRules), auth.changePassword);

export default router;
