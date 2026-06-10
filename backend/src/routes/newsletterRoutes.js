import { Router } from 'express';
import {
  subscribe,
  grantAccess,
  verifyAccess,
  confirmEmail,
  resendVerification,
  accessStatus,
  unsubscribe,
  getGenres,
} from '../controllers/newsletterController.js';

const router = Router();

router.get('/genres', getGenres);
router.get('/access', accessStatus);
router.get('/confirm-email', confirmEmail);
router.post('/subscribe', subscribe);
router.post('/grant-access', grantAccess);
router.post('/verify', verifyAccess);
router.post('/resend-verification', resendVerification);
router.get('/unsubscribe', unsubscribe);

export default router;
