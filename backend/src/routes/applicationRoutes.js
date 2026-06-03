import { Router } from 'express';
import {
  applyToEvent,
  applyToOffering,
  getApplication,
  updateApplicationStatus,
  updateApplicationQuote,
  finalizeApplication,
  getMyApplications,
  getApplicationsForEntity,
} from '../controllers/applicationController.js';
import { getDealChatMessages, postDealChatMessage, postDealChatRead } from '../controllers/dealChatController.js';
import { authenticate, requireMusician, requireVenue } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { applyToEventSchema, applyToOfferingSchema, updateApplicationStatusSchema, updateApplicationQuoteSchema } from '../validators/application.js';

const router = Router();

router.get('/my', authenticate, getMyApplications);
router.get('/:id/chat/messages', authenticate, getDealChatMessages);
router.post('/:id/chat/messages', authenticate, postDealChatMessage);
router.post('/:id/chat/read', authenticate, postDealChatRead);
router.get('/:id', authenticate, getApplication);
router.get('/entity/:entityId', authenticate, getApplicationsForEntity);

router.post('/event', authenticate, requireMusician, validate(applyToEventSchema), applyToEvent);
router.post('/offering', authenticate, requireVenue, validate(applyToOfferingSchema), applyToOffering);

router.patch('/:id/status', authenticate, validate(updateApplicationStatusSchema), updateApplicationStatus);
router.patch('/:id/quote', authenticate, validate(updateApplicationQuoteSchema), updateApplicationQuote);
router.patch('/:id/finalize', authenticate, finalizeApplication);

export default router;
