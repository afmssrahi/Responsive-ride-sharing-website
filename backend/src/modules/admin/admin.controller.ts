import { Response, NextFunction } from 'express';
import * as adminService from './admin.service';
import { AuthRequest } from '../../middleware/auth';

export async function getOverview(req: AuthRequest, res: Response, next: NextFunction) {
  try { res.json({ success: true, data: await adminService.getOverview() }); }
  catch (err) { next(err); }
}
export async function getUsers(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query['page'] as string) || 1;
    const result = await adminService.getUsers(page, 20, req.query['search'] as string, req.query['role'] as string);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
}
export async function updateUserStatus(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await adminService.updateUserStatus(req.user!.id, req.params['id'] as string, req.body.status);
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
}
export async function getDrivers(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query['page'] as string) || 1;
    const result = await adminService.getDrivers(page, 20, req.query['search'] as string);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
}
export async function approveDriver(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const approved = req.body.approved !== false;
    const user = await adminService.approveDriver(req.user!.id, req.params['id'] as string, approved);
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
}
export async function getRides(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query['page'] as string) || 1;
    const result = await adminService.getRides(page, 20, req.query['status'] as string);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
}
export async function getAnalytics(req: AuthRequest, res: Response, next: NextFunction) {
  try { res.json({ success: true, data: await adminService.getAnalytics() }); }
  catch (err) { next(err); }
}
export async function getSettings(req: AuthRequest, res: Response, next: NextFunction) {
  try { res.json({ success: true, data: await adminService.getSettings() }); }
  catch (err) { next(err); }
}
export async function updateSettings(req: AuthRequest, res: Response, next: NextFunction) {
  try { await adminService.updateSettings(req.user!.id, req.body); res.json({ success: true }); }
  catch (err) { next(err); }
}
export async function getActivityLog(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const result = await adminService.getActivityLog(page);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
}
