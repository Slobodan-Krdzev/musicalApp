import { Router } from 'express';
import { subscribe, unsubscribe } from '../controllers/newsletterController.js';

const router = Router();

router.post('/subscribe', subscribe);
router.get('/unsubscribe', unsubscribe);

export default router;
