import { Router } from 'express';
import { listParties } from '../controllers/partyController.js';

const router = Router();

router.get('/', listParties);

export default router;
