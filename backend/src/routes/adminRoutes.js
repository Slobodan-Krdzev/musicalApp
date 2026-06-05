import { Router } from 'express';
import {
  getStats,
  search,
  getCustomers,
  getDeals,
  getNewsletterStatsHandler,
  getNewsletterSubscribers,
  listUsers,
  suspendUser,
  unsuspendUser,
  cancelSubscription,
  listEvents,
  getEventAdmin,
  listApplications,
  listSubscriptions,
  listSupportTickets,
  getSupportTicket,
  updateSupportTicket,
} from '../controllers/adminController.js';
import { authenticate, requireSuperAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { updateSupportTicketSchema } from '../validators/support.js';

const router = Router();

router.use(authenticate, requireSuperAdmin);

router.get('/stats', getStats);
router.get('/search', search);
router.get('/customers', getCustomers);
router.get('/deals', getDeals);
router.get('/newsletter/stats', getNewsletterStatsHandler);
router.get('/newsletter/subscribers', getNewsletterSubscribers);
router.get('/users', listUsers);
router.post('/users/:id/suspend', suspendUser);
router.post('/users/:id/unsuspend', unsuspendUser);
router.post('/subscriptions/:userId/cancel', cancelSubscription);
router.get('/events', listEvents);
router.get('/events/:id', getEventAdmin);
router.get('/applications', listApplications);
router.get('/subscriptions', listSubscriptions);
router.get('/support/tickets', listSupportTickets);
router.get('/support/tickets/:id', getSupportTicket);
router.patch('/support/tickets/:id', validate(updateSupportTicketSchema), updateSupportTicket);

export default router;
