import { Response, NextFunction } from 'express';
import * as rideService from './ride.service';
import { AuthRequest } from '../../middleware/auth';
import { createRideSchema, searchRideSchema, bookSeatSchema } from './ride.dto';

export async function createRide(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const dto = createRideSchema.parse(req.body);
    const ride = await rideService.createRide(req.user!.id, dto);
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
    const request = await rideService.bookSeat(req.params['id'] as string, req.user!.id, dto);
    res.status(201).json({ success: true, data: request });
  } catch (err) { next(err); }
}

export async function approveRequest(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await rideService.approveRequest(req.params['id'] as string, req.params['requestId'] as string, req.user!.id);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function rejectRequest(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await rideService.rejectRequest(req.params['id'] as string, req.params['requestId'] as string, req.user!.id);
    res.json({ success: true, message: 'Request rejected' });
  } catch (err) { next(err); }
}

export async function cancelRide(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await rideService.cancelRide(req.params['id'] as string, req.user!.id, req.body.reason);
    res.json({ success: true, message: 'Ride cancelled' });
  } catch (err) { next(err); }
}

export async function startRide(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const ride = await rideService.startRide(req.params['id'] as string, req.user!.id);
    res.json({ success: true, data: ride });
  } catch (err) { next(err); }
}

export async function completeRide(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const ride = await rideService.completeRide(req.params['id'] as string, req.user!.id);
    res.json({ success: true, data: ride });
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

import { getIO } from '../../config/socket';

export async function acceptRide(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const ride = await rideService.acceptRide(req.params['id'] as string, req.user!.id);
    getIO().to(`ride:${ride.id}`).emit('ride:status_update', {
      status: ride.status,
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
