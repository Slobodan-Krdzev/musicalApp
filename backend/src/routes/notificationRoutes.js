import { Router } from 'express';
import { getMyNotifications, markRead, markAllRead } from '../controllers/notificationController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, getMyNotifications);
router.patch('/:id/read', authenticate, markRead);
router.post('/read-all', authenticate, markAllRead);

export default router;
