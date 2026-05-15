import { Request, Response, NextFunction } from 'express';
import { AppError } from '../shared/errors';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }
  // Prisma unique constraint
  if ((err as any).code === 'P2002') {
    return res.status(409).json({
      success: false,
      message: 'A record with this value already exists',
    });
  }
  // Prisma not found
  if ((err as any).code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: 'Record not found',
    });
  }
  console.error('Unhandled error:', err);
  return res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
};
