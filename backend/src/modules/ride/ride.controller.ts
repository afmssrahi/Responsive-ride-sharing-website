import { Response, NextFunction } from 'express';
import * as rideService from './ride.service';
import { AuthRequest } from '../../middleware/auth';
import { createRideSchema, searchRideSchema, bookSeatSchema } from './ride.dto';
import { getIO, broadcastRideRequest, broadcastToUsers } from '../../config/socket';

export async function createRide(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const dto = createRideSchema.parse(req.body);
    const ride = await rideService.createRide(req.user!.id, dto);

    // ── Broadcast ON_DEMAND ride to all online drivers in real-time ──────
    if (dto.type === 'ON_DEMAND') {
      broadcastRideRequest({
        id: ride.id,
        rideCode: ride.rideCode,
        pickupLocation: ride.pickupLocation,
        pickupLat: ride.pickupLat,
        pickupLng: ride.pickupLng,
        dropoffLocation: ride.dropoffLocation,
        dropoffLat: ride.dropoffLat,
        dropoffLng: ride.dropoffLng,
        totalFare: ride.totalFare,
        totalSeats: ride.totalSeats,
        createdAt: ride.createdAt,
        creator: ride.creator as any,
      });
    }

    // ── Broadcast DRIVER_CREATED_SHARED to all users in real-time ────────
    if (dto.type === 'DRIVER_CREATED_SHARED') {
      broadcastToUsers('ride:offer_published', {
        id: ride.id,
        type: 'DRIVER_CREATED_SHARED',
        rideCode: ride.rideCode,
        pickupLocation: ride.pickupLocation,
        dropoffLocation: ride.dropoffLocation,
        totalSeats: ride.totalSeats,
        availableSeats: ride.availableSeats,
        pricePerSeat: ride.pricePerSeat,
        departureTime: ride.departureTime,
        notes: ride.notes,
        status: ride.status,
        // Include as both 'driver' and 'creator' so any frontend field name works
        driver: ride.creator,
        creator: ride.creator,
        vehicle: ride.vehicle,
        createdAt: ride.createdAt,
      });
    }

    res.status(201).json({ success: true, data: ride });
  } catch (err) { next(err); }
}

export async function searchRides(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const dto = searchRideSchema.parse(req.query as Record<string, string>);
    const result = await rideService.searchRides(dto);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
}

export async function getSharedRides(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const dto = searchRideSchema.parse(req.query as Record<string, string>);
    const result = await rideService.searchRides(dto);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
}

export async function getRide(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const ride = await rideService.getRideById(req.params['id'] as string, req.user!.id);
    res.json({ success: true, data: ride });
  } catch (err) { next(err); }
}

export async function bookSeat(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const dto = bookSeatSchema.parse(req.body);
    const { request, updatedRide } = await rideService.bookSeat(req.params['id'] as string, req.user!.id, dto);

    // ── Notify the ride room that a new passenger has joined (pending) ────
    getIO().to(`ride:${req.params['id']}`).emit('ride:passenger_joined', {
      requestId: request.id,
      seatsRequested: request.seatsRequested,
      status: 'PENDING',
    });

    res.status(201).json({ success: true, data: request });
  } catch (err) { next(err); }
}

export async function approveRequest(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { result, updatedRide } = await rideService.approveRequest(req.params['id'] as string, req.params['requestId'] as string, req.user!.id);

    // ── Broadcast updated seat count to the ride room ─────────────────────
    getIO().to(`ride:${req.params['id']}`).emit('ride:seat_update', {
      availableSeats: updatedRide.availableSeats,
      totalSeats: updatedRide.totalSeats,
      requestId: req.params['requestId'],
      status: 'APPROVED',
    });

    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function rejectRequest(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const updatedRide = await rideService.rejectRequest(req.params['id'] as string, req.params['requestId'] as string, req.user!.id);

    // ── Notify ride room of rejection ─────────────────────────────────────
    getIO().to(`ride:${req.params['id']}`).emit('ride:seat_update', {
      availableSeats: updatedRide?.availableSeats,
      totalSeats: updatedRide?.totalSeats,
      requestId: req.params['requestId'],
      status: 'REJECTED',
    });

    res.json({ success: true, message: 'Request rejected' });
  } catch (err) { next(err); }
}

export async function cancelRide(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await rideService.cancelRide(req.params['id'] as string, req.user!.id, req.body.reason);
    getIO().to(`ride:${req.params['id']}`).emit('ride:status_update', { status: 'CANCELLED' });
    res.json({ success: true, message: 'Ride cancelled' });
  } catch (err) { next(err); }
}

export async function startRide(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const ride = await rideService.startRide(req.params['id'] as string, req.user!.id);
    getIO().to(`ride:${ride.id}`).emit('ride:status_update', { status: 'IN_PROGRESS' });
    res.json({ success: true, data: ride });
  } catch (err) { next(err); }
}

export async function completeRide(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const ride = await rideService.completeRide(req.params['id'] as string, req.user!.id);
    // Broadcast COMPLETED with totalFare so user knows how much to pay
    const fareAmount = ride.totalFare || ride.pricePerSeat || 0;
    getIO().to(`ride:${ride.id}`).emit('ride:status_update', {
      status: 'COMPLETED',
      totalFare: ride.totalFare,
      pricePerSeat: ride.pricePerSeat,
    });
    // Also notify the creator directly
    getIO().to(`user:${ride.creatorId}`).emit('ride:status_update', {
      status: 'COMPLETED',
      rideId: ride.id,
      totalFare: ride.totalFare,
      pricePerSeat: ride.pricePerSeat,
    });
    res.json({ success: true, data: ride });
  } catch (err) { next(err); }
}

export async function payRide(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { paymentMethod } = req.body;
    const result = await rideService.payRide(
      req.params['id'] as string,
      req.user!.id,
      paymentMethod || 'CASH',
    );
    // Notify the ride room and driver about payment
    getIO().to(`ride:${result.ride.id}`).emit('ride:payment', {
      status: 'PAID',
      amount: result.amountPaid,
      method: result.paymentMethod,
    });
    if (result.ride.driverId) {
      getIO().to(`user:${result.ride.driverId}`).emit('ride:payment', {
        rideId: result.ride.id,
        status: 'PAID',
        amount: result.amountPaid,
        method: result.paymentMethod,
      });
    }
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function myCreatedRides(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const result = await rideService.myCreatedRides(req.user!.id, page, limit);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
}

export async function myJoinedRides(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const result = await rideService.myJoinedRides(req.user!.id, page, limit);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
}

export async function getRideTypes(_req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const types = await rideService.getRideTypes();
    res.json({ success: true, data: types });
  } catch (err) { next(err); }
}

export async function acceptRide(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const ride = await rideService.acceptRide(req.params['id'] as string, req.user!.id);
    getIO().to(`ride:${ride.id}`).emit('ride:status_update', {
      status: ride.status,
      driver: ride.driver,
    });
    // Also notify the passenger directly
    getIO().to(`user:${ride.creatorId}`).emit('ride:status_update', {
      status: ride.status,
      rideId: ride.id,
      driver: ride.driver,
    });
    res.json({ success: true, data: ride });
  } catch (err) { next(err); }
}

export async function getPendingRides(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await rideService.getPendingRides(page, limit);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
}
