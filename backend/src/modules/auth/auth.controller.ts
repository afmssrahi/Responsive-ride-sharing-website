import { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service';
import { registerSchema, loginSchema, changePasswordSchema, driverApplySchema } from './auth.dto';
import { AuthRequest } from '../../middleware/auth';
import { BadRequestError } from '../../shared/errors';

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const dto = registerSchema.parse(req.body);
    const result = await authService.register(dto);
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const dto = loginSchema.parse(req.body);
    const result = await authService.login(dto);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function refreshToken(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) throw new BadRequestError('Refresh token required');
    const tokens = await authService.refresh(refreshToken);
    res.json({ success: true, data: tokens });
  } catch (err) { next(err); }
}

export async function logout(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await authService.logout(req.user!.id);
    res.json({ success: true, message: 'Logged out' });
  } catch (err) { next(err); }
}

export async function getMe(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await authService.getMe(req.user!.id);
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
}

export async function changePassword(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const dto = changePasswordSchema.parse(req.body);
    await authService.changePassword(req.user!.id, dto);
    res.json({ success: true, message: 'Password updated' });
  } catch (err) { next(err); }
}

export async function driverApply(req: Request, res: Response, next: NextFunction) {
  try {
    const dto = driverApplySchema.parse(req.body);
    const files = (req.files as Express.Multer.File[]) || [];
    const result = await authService.driverApply(dto, files);
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
}
