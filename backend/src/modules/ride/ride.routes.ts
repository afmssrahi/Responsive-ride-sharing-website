import { Router } from 'express';
import * as ctrl from './ride.controller';
import { authenticate, requireRole } from '../../middleware/auth';

const router = Router();

// Public
router.get('/types', ctrl.getRideTypes);
router.get('/shared', authenticate, ctrl.getSharedRides);
router.get('/search', authenticate, ctrl.searchRides);

// Auth required
router.get('/my-created', authenticate, ctrl.myCreatedRides);
router.get('/my-joined', authenticate, ctrl.myJoinedRides);

// Ride CRUD
router.post('/create', authenticate, ctrl.createRide);
router.get('/:id', authenticate, ctrl.getRide);
router.post('/:id/cancel', authenticate, ctrl.cancelRide);

// Driver actions
router.post('/:id/start', authenticate, requireRole('DRIVER'), ctrl.startRide);
router.post('/:id/complete', authenticate, requireRole('DRIVER'), ctrl.completeRide);
router.patch('/:id/approve/:requestId', authenticate, requireRole('DRIVER'), ctrl.approveRequest);
router.patch('/:id/reject/:requestId', authenticate, requireRole('DRIVER'), ctrl.rejectRequest);

// Passenger seat booking
router.post('/:id/book-seat', authenticate, requireRole('USER'), ctrl.bookSeat);

export default router;
