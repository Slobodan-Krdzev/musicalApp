import { Router } from 'express';
import { listParties } from '../controllers/partyController.js';
import { requireNewsletterOrAuth } from '../middleware/newsletterAccess.js';

const router = Router();

router.get('/', requireNewsletterOrAuth, listParties);

export default router;
