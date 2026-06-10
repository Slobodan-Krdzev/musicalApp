import { Router } from 'express';
import {
  subscribe,
  grantAccess,
  verifyAccess,
  accessStatus,
  unsubscribe,
  getGenres,
} from '../controllers/newsletterController.js';

const router = Router();

router.get('/genres', getGenres);
router.get('/access', accessStatus);
router.post('/subscribe', subscribe);
router.post('/grant-access', grantAccess);
router.post('/verify', verifyAccess);
router.get('/unsubscribe', unsubscribe);

export default router;
