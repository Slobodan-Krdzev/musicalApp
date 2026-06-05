import { Router } from 'express';
import {
  getSupportContact,
  listMySupportTickets,
  createTicket,
  getMySupportTicket,
} from '../controllers/supportController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createSupportTicketSchema } from '../validators/support.js';

const router = Router();

router.get('/contact', getSupportContact);

router.get('/', authenticate, listMySupportTickets);
router.post('/', authenticate, validate(createSupportTicketSchema), createTicket);
router.get('/:id', authenticate, getMySupportTicket);

export default router;
