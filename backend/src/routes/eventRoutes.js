import { Router } from 'express';
import {
  listEvents,
  getEvent,
  createEvent,
  updateEvent,
  getMyEvents,
} from '../controllers/eventController.js';
import { authenticate, requireVenue } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createEventSchema, updateEventSchema, eventQuerySchema } from '../validators/event.js';

const router = Router();

router.get('/', validate(eventQuerySchema, (req) => req.query), listEvents);
router.get('/my', authenticate, requireVenue, getMyEvents);
router.get('/:id', getEvent);
router.post('/', authenticate, requireVenue, validate(createEventSchema), createEvent);
router.put('/:id', authenticate, requireVenue, validate(updateEventSchema), updateEvent);

export default router;
