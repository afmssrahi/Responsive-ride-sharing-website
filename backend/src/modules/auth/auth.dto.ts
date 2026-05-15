import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

export const driverApplySchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  password: z.string().min(6),
  city: z.string().min(2),
  nid: z.string().optional(),
  vehicleMake: z.string().min(1),
  vehicleModel: z.string().min(1),
  vehicleYear: z.coerce.number().min(2010).max(2026),
  vehicleColor: z.string().min(1),
  vehicleType: z.enum(['SEDAN', 'SUV', 'HATCHBACK', 'MINIVAN', 'MICROBUS', 'OTHER']).default('SEDAN'),
  vehiclePlate: z.string().min(1),
  vehicleSeats: z.coerce.number().min(2).max(15).default(4),
});

export type RegisterDto = z.infer<typeof registerSchema>;
export type LoginDto = z.infer<typeof loginSchema>;
export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;
export type DriverApplyDto = z.infer<typeof driverApplySchema>;
