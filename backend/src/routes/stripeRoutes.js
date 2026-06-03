import { Router } from 'express';
import {
  createSubscriptionCheckout,
  syncSubscription,
  cancelMySubscription,
  resumeMySubscription,
  getInvoices,
  createCheckoutFreeTrial,
  createPortal,
  getStripeConfig,
} from '../controllers/stripeController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/config', getStripeConfig);
router.post('/create-subscription', authenticate, createSubscriptionCheckout);
router.post('/sync', authenticate, syncSubscription);
router.post('/cancel', authenticate, cancelMySubscription);
router.post('/resume', authenticate, resumeMySubscription);
router.get('/invoices', authenticate, getInvoices);
router.post('/create-portal', authenticate, createPortal);
router.post('/start-trial', authenticate, createCheckoutFreeTrial);

export default router;
