import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import * as ctrl from './chat.controller';

const router = Router();

router.get('/unread-count', authenticate, ctrl.getUnreadCount);
router.get('/:rideId', authenticate, ctrl.getConversation);
router.post('/:rideId/send', authenticate, ctrl.sendMessage);

export default router;
