import { Router } from 'express';
import { getMyNotifications, markRead, markAllRead, deleteNotification } from '../controllers/notificationController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, getMyNotifications);
router.patch('/:id/read', authenticate, markRead);
router.delete('/:id', authenticate, deleteNotification);
router.post('/read-all', authenticate, markAllRead);

export default router;
