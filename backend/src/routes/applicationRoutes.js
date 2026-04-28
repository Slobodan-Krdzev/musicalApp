import { Router } from 'express';
import {
  applyToEvent,
  applyToOffering,
  getApplication,
  updateApplicationStatus,
  finalizeApplication,
  getMyApplications,
  getApplicationsForEntity,
} from '../controllers/applicationController.js';
import { authenticate, requireMusician, requireVenue } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { applyToEventSchema, applyToOfferingSchema, updateApplicationStatusSchema } from '../validators/application.js';

const router = Router();

router.get('/my', authenticate, getMyApplications);
router.get('/:id', authenticate, getApplication);
router.get('/entity/:entityId', authenticate, getApplicationsForEntity);

router.post('/event', authenticate, requireMusician, validate(applyToEventSchema), applyToEvent);
router.post('/offering', authenticate, requireVenue, validate(applyToOfferingSchema), applyToOffering);

router.patch('/:id/status', authenticate, validate(updateApplicationStatusSchema), updateApplicationStatus);
router.patch('/:id/finalize', authenticate, finalizeApplication);

export default router;
