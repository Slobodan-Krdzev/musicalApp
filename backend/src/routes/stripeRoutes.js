import { Router } from 'express';
import { createCheckout, createCheckoutFreeTrial } from '../controllers/stripeController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/create-checkout', authenticate, createCheckout);
router.post('/start-trial', authenticate, createCheckoutFreeTrial);

export default router;
