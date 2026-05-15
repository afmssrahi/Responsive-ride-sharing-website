import { Router } from 'express';
import * as ctrl from './user.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/profile', ctrl.getProfile);
router.put('/profile', ctrl.updateProfile);
router.get('/rides', ctrl.getRideHistory);

router.get('/saved-places', ctrl.getSavedPlaces);
router.post('/saved-places', ctrl.addSavedPlace);
router.delete('/saved-places/:id', ctrl.deleteSavedPlace);

router.get('/payment-methods', ctrl.getPaymentMethods);
router.post('/payment-methods', ctrl.addPaymentMethod);
router.put('/payment-methods/:id/default', ctrl.setDefaultPayment);
router.delete('/payment-methods/:id', ctrl.deletePaymentMethod);

router.get('/preferences', ctrl.getNotificationPrefs);
router.put('/preferences', ctrl.updateNotificationPrefs);

export default router;
