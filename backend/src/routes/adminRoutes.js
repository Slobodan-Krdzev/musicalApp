import { Router } from 'express';
import {
  getStats,
  listUsers,
  suspendUser,
  unsuspendUser,
  cancelSubscription,
  listEvents,
  listApplications,
  listDeals,
  listSubscriptions,
} from '../controllers/adminController.js';
import { authenticate, requireSuperAdmin } from '../middleware/auth.js';

const router = Router();

router.use(authenticate, requireSuperAdmin);

router.get('/stats', getStats);
router.get('/users', listUsers);
router.post('/users/:id/suspend', suspendUser);
router.post('/users/:id/unsuspend', unsuspendUser);
router.post('/subscriptions/:userId/cancel', cancelSubscription);
router.get('/events', listEvents);
router.get('/applications', listApplications);
router.get('/deals', listDeals);
router.get('/subscriptions', listSubscriptions);

export default router;
