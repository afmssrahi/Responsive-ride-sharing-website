import { Router } from 'express';
import * as ctrl from './auth.controller';
import { authenticate } from '../../middleware/auth';
import { upload } from '../../middleware/upload';

const router = Router();

router.post('/register', ctrl.register);
router.post('/login', ctrl.login);
router.post('/refresh', ctrl.refreshToken);
router.post('/logout', authenticate, ctrl.logout);
router.get('/me', authenticate, ctrl.getMe);
router.post('/change-password', authenticate, ctrl.changePassword);
router.post('/driver/apply', upload.array('documents', 5), ctrl.driverApply);

export default router;
