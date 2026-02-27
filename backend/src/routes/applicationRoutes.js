import { Router } from 'express';
import {
  applyToEvent,
  getApplicationsForEvent,
  updateApplicationStatus,
  getMyApplications,
} from '../controllers/applicationController.js';
import { authenticate, requireMusician, requireVenue } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createApplicationSchema, updateApplicationStatusSchema } from '../validators/application.js';

const router = Router();

router.post('/', authenticate, requireMusician, validate(createApplicationSchema), applyToEvent);
router.get('/my', authenticate, requireMusician, getMyApplications);
router.get('/event/:eventId', authenticate, requireVenue, getApplicationsForEvent);
router.patch('/:id', authenticate, requireVenue, validate(updateApplicationStatusSchema), updateApplicationStatus);

export default router;
