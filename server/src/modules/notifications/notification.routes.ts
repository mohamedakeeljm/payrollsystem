import { Router } from 'express';
import { NotificationController } from './notification.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', NotificationController.getNotifications);
router.put('/:id/read', NotificationController.markAsRead);

export default router;
