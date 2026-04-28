import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, refresh, me, verifyEmail, resendVerification } from '../controllers/authController.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { registerSchema, loginSchema, refreshSchema } from '../validators/auth.js';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, error: 'Too many attempts, try again later' },
});

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/refresh', validate(refreshSchema), refresh);
router.get('/me', authenticate, me);
router.get('/verify-email', verifyEmail);
router.post('/resend-verification', authenticate, resendVerification);

export default router;
