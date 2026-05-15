import { Response, NextFunction } from 'express';
import * as driverService from './driver.service';
import { AuthRequest } from '../../middleware/auth';

export async function getProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try { res.json({ success: true, data: await driverService.getProfile(req.user!.id) }); }
  catch (err) { next(err); }
}
export async function updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try { res.json({ success: true, data: await driverService.updateProfile(req.user!.id, req.body) }); }
  catch (err) { next(err); }
}
export async function updateVehicle(req: AuthRequest, res: Response, next: NextFunction) {
  try { await driverService.updateVehicle(req.user!.id, req.body); res.json({ success: true }); }
  catch (err) { next(err); }
}
export async function updatePayout(req: AuthRequest, res: Response, next: NextFunction) {
  try { res.json({ success: true, data: await driverService.updatePayoutSettings(req.user!.id, req.body) }); }
  catch (err) { next(err); }
}
export async function updateWorkPreferences(req: AuthRequest, res: Response, next: NextFunction) {
  try { res.json({ success: true, data: await driverService.updateWorkPreferences(req.user!.id, req.body) }); }
  catch (err) { next(err); }
}
export async function toggleOnline(req: AuthRequest, res: Response, next: NextFunction) {
  try { res.json({ success: true, data: await driverService.toggleOnline(req.user!.id) }); }
  catch (err) { next(err); }
}
export async function getEarnings(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const period = (req.query.period as 'week' | 'month') || 'week';
    res.json({ success: true, data: await driverService.getEarnings(req.user!.id, period) });
  } catch (err) { next(err); }
}
export async function getRatings(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const result = await driverService.getRatings(req.user!.id, page);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
}
export async function getDocuments(req: AuthRequest, res: Response, next: NextFunction) {
  try { res.json({ success: true, data: await driverService.getDocuments(req.user!.id) }); }
  catch (err) { next(err); }
}
export async function uploadDocument(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const doc = await driverService.updateDocument(req.user!.id, req.body.type, req.file.path);
    res.json({ success: true, data: doc });
  } catch (err) { next(err); }
}
export async function getTrips(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const result = await driverService.getTrips(req.user!.id, page);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
}
