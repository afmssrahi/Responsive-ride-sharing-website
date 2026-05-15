import { Response, NextFunction } from 'express';
import * as userService from './user.service';
import { AuthRequest } from '../../middleware/auth';

export async function getProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try { res.json({ success: true, data: await userService.getProfile(req.user!.id) }); }
  catch (err) { next(err); }
}
export async function updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try { res.json({ success: true, data: await userService.updateProfile(req.user!.id, req.body) }); }
  catch (err) { next(err); }
}
export async function getRideHistory(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const result = await userService.getRideHistory(req.user!.id, page, limit);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
}
export async function getSavedPlaces(req: AuthRequest, res: Response, next: NextFunction) {
  try { res.json({ success: true, data: await userService.getSavedPlaces(req.user!.id) }); }
  catch (err) { next(err); }
}
export async function addSavedPlace(req: AuthRequest, res: Response, next: NextFunction) {
  try { res.status(201).json({ success: true, data: await userService.addSavedPlace(req.user!.id, req.body) }); }
  catch (err) { next(err); }
}
export async function deleteSavedPlace(req: AuthRequest, res: Response, next: NextFunction) {
  try { await userService.deleteSavedPlace(req.user!.id, req.params['id'] as string); res.json({ success: true }); }
  catch (err) { next(err); }
}
export async function getPaymentMethods(req: AuthRequest, res: Response, next: NextFunction) {
  try { res.json({ success: true, data: await userService.getPaymentMethods(req.user!.id) }); }
  catch (err) { next(err); }
}
export async function addPaymentMethod(req: AuthRequest, res: Response, next: NextFunction) {
  try { res.status(201).json({ success: true, data: await userService.addPaymentMethod(req.user!.id, req.body) }); }
  catch (err) { next(err); }
}
export async function setDefaultPayment(req: AuthRequest, res: Response, next: NextFunction) {
  try { await userService.setDefaultPayment(req.user!.id, req.params['id'] as string); res.json({ success: true }); }
  catch (err) { next(err); }
}
export async function deletePaymentMethod(req: AuthRequest, res: Response, next: NextFunction) {
  try { await userService.deletePaymentMethod(req.user!.id, req.params['id'] as string); res.json({ success: true }); }
  catch (err) { next(err); }
}
export async function getNotificationPrefs(req: AuthRequest, res: Response, next: NextFunction) {
  try { res.json({ success: true, data: await userService.getNotificationPrefs(req.user!.id) }); }
  catch (err) { next(err); }
}
export async function updateNotificationPrefs(req: AuthRequest, res: Response, next: NextFunction) {
  try { res.json({ success: true, data: await userService.updateNotificationPrefs(req.user!.id, req.body) }); }
  catch (err) { next(err); }
}
