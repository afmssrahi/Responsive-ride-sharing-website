import { Router } from 'express';
import * as ctrl from './driver.controller';
import { authenticate, requireRole } from '../../middleware/auth';
import { upload } from '../../middleware/upload';

const router = Router();
router.use(authenticate, requireRole('DRIVER'));

router.get('/profile', ctrl.getProfile);
router.put('/profile', ctrl.updateProfile);
router.put('/vehicle', ctrl.updateVehicle);
router.put('/payout', ctrl.updatePayout);
router.put('/work-preferences', ctrl.updateWorkPreferences);
router.post('/toggle-online', ctrl.toggleOnline);
router.get('/earnings', ctrl.getEarnings);
router.get('/ratings', ctrl.getRatings);
router.get('/documents', ctrl.getDocuments);
router.post('/documents', upload.single('file'), ctrl.uploadDocument);
router.get('/trips', ctrl.getTrips);

export default router;
