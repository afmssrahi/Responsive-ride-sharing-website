import { Router } from 'express';
import * as ctrl from './admin.controller';
import { authenticate, requireRole } from '../../middleware/auth';

const router = Router();
router.use(authenticate, requireRole('ADMIN'));

router.get('/overview', ctrl.getOverview);
router.get('/users', ctrl.getUsers);
router.put('/users/:id/status', ctrl.updateUserStatus);
router.get('/drivers', ctrl.getDrivers);
router.put('/drivers/:id/approve', ctrl.approveDriver);
router.get('/rides', ctrl.getRides);
router.get('/analytics', ctrl.getAnalytics);
router.get('/settings', ctrl.getSettings);
router.put('/settings', ctrl.updateSettings);
router.get('/activity-log', ctrl.getActivityLog);

export default router;
