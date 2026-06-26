import { Router } from 'express';
import * as notifications from '../controllers/notificationController.js';
import { protect } from '../middleware/auth.js';

const router = Router();
router.use(protect);

router.get('/', notifications.listNotifications);
router.get('/unread-count', notifications.unreadCount);
router.patch('/read-all', notifications.markAll);
router.patch('/:id/read', notifications.markRead);
router.delete('/:id', notifications.removeNotification);

export default router;
