import { z } from 'zod';

export const createRideSchema = z.object({
  type: z.enum(['ON_DEMAND', 'DRIVER_CREATED_SHARED', 'USER_BOOKED_SHARED']).default('ON_DEMAND'),
  pickupLocation: z.string().min(1),
  pickupLat: z.coerce.number(),
  pickupLng: z.coerce.number(),
  dropoffLocation: z.string().min(1),
  dropoffLat: z.coerce.number(),
  dropoffLng: z.coerce.number(),
  departureTime: z.string().datetime().optional(),
  totalSeats: z.coerce.number().min(1).max(15).default(1),
  pricePerSeat: z.coerce.number().positive().optional(),
  totalFare: z.coerce.number().positive().optional(),
  paymentMethod: z.enum(['CASH', 'BKASH', 'NAGAD', 'ROCKET', 'CARD']).default('CASH'),
  vehicleId: z.string().optional(),
  notes: z.string().optional(),
  sharingEnabled: z.boolean().default(false),
  promoCode: z.string().optional(),
});

export const searchRideSchema = z.object({
  pickup: z.string().optional(),
  destination: z.string().optional(),
  date: z.string().optional(),
  seats: z.coerce.number().min(1).default(1),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(10),
});

export const bookSeatSchema = z.object({
  seatsRequested: z.coerce.number().min(1).max(8),
  pickupLocation: z.string().optional(),
  pickupLat: z.coerce.number().optional(),
  pickupLng: z.coerce.number().optional(),
  dropoffLocation: z.string().optional(),
  dropoffLat: z.coerce.number().optional(),
  dropoffLng: z.coerce.number().optional(),
  message: z.string().optional(),
});

export type CreateRideDto = z.infer<typeof createRideSchema>;
export type SearchRideDto = z.infer<typeof searchRideSchema>;
export type BookSeatDto = z.infer<typeof bookSeatSchema>;
