import prisma from '../../config/database';
import { CreateRideDto, SearchRideDto, BookSeatDto } from './ride.dto';
import {
  BadRequestError, NotFoundError, ConflictError,
  ForbiddenError, InsufficientSeatsError
} from '../../shared/errors';
import { generateRideCode, paginate, paginationMeta } from '../../shared/utils/helpers';
import { RideStatus, BookingStatus } from '@prisma/client';

// ── Create Ride ─────────────────────────────────────────────────────
export async function createRide(userId: string, dto: CreateRideDto) {
  // For shared rides, price per seat is required
  if (dto.type === 'DRIVER_CREATED_SHARED' && !dto.pricePerSeat) {
    throw new BadRequestError('Price per seat is required for shared rides');
  }

  // Verify vehicle if provided
  if (dto.vehicleId) {
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: dto.vehicleId, ownerId: userId, isActive: true }
    });
    if (!vehicle) throw new BadRequestError('Vehicle not found or not yours');
  }

  // Validate promo code
  let promoCodeId: string | undefined;
  if (dto.promoCode) {
    const promo = await prisma.promoCode.findUnique({ where: { code: dto.promoCode } });
    if (promo && promo.isActive && new Date() <= promo.validUntil && promo.currentUses < promo.maxUses) {
      promoCodeId = promo.id;
      await prisma.promoCode.update({ where: { id: promo.id }, data: { currentUses: { increment: 1 } } });
    }
  }

  const rideCode = generateRideCode();

  const status: RideStatus = dto.type === 'DRIVER_CREATED_SHARED' ? 'CONFIRMED' : 'PENDING';

  const ride = await prisma.ride.create({
    data: {
      rideCode,
      type: dto.type,
      status,
      creatorId: userId,
      driverId: dto.type === 'DRIVER_CREATED_SHARED' ? userId : undefined,
      vehicleId: dto.vehicleId,
      pickupLocation: dto.pickupLocation,
      pickupLat: dto.pickupLat,
      pickupLng: dto.pickupLng,
      dropoffLocation: dto.dropoffLocation,
      dropoffLat: dto.dropoffLat,
      dropoffLng: dto.dropoffLng,
      departureTime: dto.departureTime ? new Date(dto.departureTime) : undefined,
      totalSeats: dto.totalSeats,
      availableSeats: dto.totalSeats,
      pricePerSeat: dto.pricePerSeat,
      paymentMethod: dto.paymentMethod,
      sharingEnabled: dto.sharingEnabled,
      notes: dto.notes,
      promoCodeId,
    },
    include: { creator: { select: { id: true, name: true, avatar: true, rating: false } }, vehicle: true },
  });

  return ride;
}

// ── Search / Browse Shared Rides ─────────────────────────────────────
export async function searchRides(dto: SearchRideDto) {
  const { skip, take } = paginate(dto.page, dto.limit);

  const where: any = {
    type: 'DRIVER_CREATED_SHARED',
    status: 'CONFIRMED',
    availableSeats: { gte: dto.seats },
    ...(dto.date && {
      departureTime: {
        gte: new Date(dto.date),
        lt: new Date(new Date(dto.date).getTime() + 86400000),
      },
    }),
    ...(dto.pickup && { pickupLocation: { contains: dto.pickup } }),
    ...(dto.destination && { dropoffLocation: { contains: dto.destination } }),
    ...(dto.minPrice && { pricePerSeat: { gte: dto.minPrice } }),
    ...(dto.maxPrice && { pricePerSeat: { lte: dto.maxPrice } }),
  };

  const [rides, total] = await Promise.all([
    prisma.ride.findMany({
      where,
      skip,
      take,
      orderBy: { departureTime: 'asc' },
      include: {
        driver: { select: { id: true, name: true, avatar: true, driverProfile: { select: { rating: true } } } },
        vehicle: true,
        _count: { select: { participants: true } },
      },
    }),
    prisma.ride.count({ where }),
  ]);

  return { rides, meta: paginationMeta(total, dto.page, dto.limit) };
}

// ── Get Ride by ID ────────────────────────────────────────────────────
export async function getRideById(rideId: string, userId: string) {
  const ride = await prisma.ride.findUnique({
    where: { id: rideId },
    include: {
      creator: { select: { id: true, name: true, avatar: true } },
      driver: { select: { id: true, name: true, avatar: true, driverProfile: { select: { rating: true, totalRides: true } } } },
      vehicle: true,
      participants: { include: { user: { select: { id: true, name: true, avatar: true } } } },
      shareRequests: {
        where: { userId },
        select: { id: true, status: true, seatsRequested: true },
      },
      route: true,
      ratings: { where: { toUserId: userId } },
    },
  });
  if (!ride) throw new NotFoundError('Ride not found');
  return ride;
}

// ── Book Seat (TRANSACTION-SAFE) ──────────────────────────────────────
export async function bookSeat(rideId: string, userId: string, dto: BookSeatDto) {
  return prisma.$transaction(async (tx) => {
    // Lock the ride row
    const ride = await tx.ride.findUnique({ where: { id: rideId } });
    if (!ride) throw new NotFoundError('Ride not found');
    if (ride.status !== 'CONFIRMED') throw new BadRequestError('Ride is not available for booking');
    if (ride.creatorId === userId) throw new BadRequestError('Cannot book your own ride');

    // Check for duplicate request
    const existingRequest = await tx.rideShareRequest.findUnique({
      where: { rideId_userId: { rideId, userId } },
    });
    if (existingRequest) throw new ConflictError('You already have a request for this ride');

    // Check seat availability
    if (ride.availableSeats < dto.seatsRequested) {
      throw new InsufficientSeatsError(`Only ${ride.availableSeats} seats available`);
    }

    // Create share request (pending driver approval)
    const request = await tx.rideShareRequest.create({
      data: {
        rideId,
        userId,
        seatsRequested: dto.seatsRequested,
        status: 'PENDING',
        message: dto.message,
        pickupLocation: dto.pickupLocation,
        pickupLat: dto.pickupLat,
        pickupLng: dto.pickupLng,
        dropoffLocation: dto.dropoffLocation,
        dropoffLat: dto.dropoffLat,
        dropoffLng: dto.dropoffLng,
      },
    });

    // Notify driver
    if (ride.driverId) {
      await tx.notification.create({
        data: {
          userId: ride.driverId,
          title: 'New Seat Request',
          body: `Someone wants ${dto.seatsRequested} seat(s) on your ride to ${ride.dropoffLocation}`,
          type: 'RIDE_REQUEST',
          data: { rideId, requestId: request.id },
        },
      });
    }

    return request;
  });
}

// ── Approve Seat Request (TRANSACTION-SAFE) ───────────────────────────
export async function approveRequest(rideId: string, requestId: string, driverId: string) {
  return prisma.$transaction(async (tx) => {
    const ride = await tx.ride.findUnique({ where: { id: rideId } });
    if (!ride) throw new NotFoundError('Ride not found');
    if (ride.driverId !== driverId) throw new ForbiddenError('Not your ride');

    const request = await tx.rideShareRequest.findUnique({ where: { id: requestId } });
    if (!request || request.rideId !== rideId) throw new NotFoundError('Request not found');
    if (request.status !== 'PENDING') throw new BadRequestError('Request already processed');

    // Re-check availability (may have changed)
    if (ride.availableSeats < request.seatsRequested) {
      throw new InsufficientSeatsError('No longer enough seats');
    }

    // Update request status
    await tx.rideShareRequest.update({
      where: { id: requestId },
      data: { status: 'APPROVED', respondedAt: new Date() },
    });

    // Decrement available seats
    await tx.ride.update({
      where: { id: rideId },
      data: { availableSeats: { decrement: request.seatsRequested } },
    });

    // Create participant record
    const fare = ride.pricePerSeat ? ride.pricePerSeat * request.seatsRequested : undefined;
    await tx.rideParticipant.create({
      data: {
        rideId,
        userId: request.userId,
        seatsBooked: request.seatsRequested,
        status: 'APPROVED',
        fareAmount: fare,
        pickupLocation: request.pickupLocation,
        pickupLat: request.pickupLat ?? undefined,
        pickupLng: request.pickupLng ?? undefined,
        dropoffLocation: request.dropoffLocation,
        dropoffLat: request.dropoffLat ?? undefined,
        dropoffLng: request.dropoffLng ?? undefined,
      },
    });

    // Notify passenger
    await tx.notification.create({
      data: {
        userId: request.userId,
        title: 'Seat Request Approved! 🎉',
        body: `Your request for ${request.seatsRequested} seat(s) to ${ride.dropoffLocation} was approved`,
        type: 'SEAT_APPROVED',
        data: { rideId },
      },
    });

    return { success: true };
  });
}

// ── Reject Seat Request ───────────────────────────────────────────────
export async function rejectRequest(rideId: string, requestId: string, driverId: string) {
  const ride = await prisma.ride.findUnique({ where: { id: rideId } });
  if (!ride || ride.driverId !== driverId) throw new ForbiddenError('Not your ride');

  const request = await prisma.rideShareRequest.findUnique({ where: { id: requestId } });
  if (!request || request.rideId !== rideId) throw new NotFoundError('Request not found');
  if (request.status !== 'PENDING') throw new BadRequestError('Request already processed');

  await prisma.rideShareRequest.update({
    where: { id: requestId },
    data: { status: 'REJECTED', respondedAt: new Date() },
  });

  await prisma.notification.create({
    data: {
      userId: request.userId,
      title: 'Seat Request Declined',
      body: `Your request for a seat to ${ride.dropoffLocation} was declined by the driver`,
      type: 'SEAT_REJECTED',
      data: { rideId },
    },
  });
}

// ── Cancel Ride ───────────────────────────────────────────────────────
export async function cancelRide(rideId: string, userId: string, reason?: string) {
  const ride = await prisma.ride.findUnique({ where: { id: rideId }, include: { participants: true } });
  if (!ride) throw new NotFoundError('Ride not found');
  if (ride.creatorId !== userId && ride.driverId !== userId) throw new ForbiddenError();
  if (['COMPLETED', 'CANCELLED'].includes(ride.status)) throw new BadRequestError('Cannot cancel this ride');

  await prisma.$transaction([
    prisma.ride.update({
      where: { id: rideId },
      data: { status: 'CANCELLED', cancelReason: reason },
    }),
    // Notify all participants
    ...ride.participants.map(p =>
      prisma.notification.create({
        data: {
          userId: p.userId,
          title: 'Ride Cancelled',
          body: `Your ride to ${ride.dropoffLocation} was cancelled`,
          type: 'RIDE_CANCELLED',
          data: { rideId },
        },
      })
    ),
  ]);
}

// ── Start Ride ────────────────────────────────────────────────────────
export async function startRide(rideId: string, driverId: string) {
  const ride = await prisma.ride.findUnique({ where: { id: rideId } });
  if (!ride) throw new NotFoundError();
  if (ride.driverId !== driverId) throw new ForbiddenError();
  if (ride.status !== 'CONFIRMED') throw new BadRequestError('Ride is not confirmed');

  return prisma.ride.update({
    where: { id: rideId },
    data: { status: 'IN_PROGRESS', startedAt: new Date() },
  });
}

// ── Complete Ride ─────────────────────────────────────────────────────
export async function completeRide(rideId: string, driverId: string) {
  return prisma.$transaction(async (tx) => {
    const ride = await tx.ride.findUnique({ where: { id: rideId }, include: { participants: true } });
    if (!ride) throw new NotFoundError();
    if (ride.driverId !== driverId) throw new ForbiddenError();
    if (ride.status !== 'IN_PROGRESS') throw new BadRequestError('Ride not in progress');

    const completedRide = await tx.ride.update({
      where: { id: rideId },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });

    // Update driver stats
    const earnings = ride.pricePerSeat
      ? ride.pricePerSeat * (ride.totalSeats - ride.availableSeats)
      : ride.totalFare || 0;

    await tx.driverProfile.update({
      where: { userId: driverId },
      data: { totalRides: { increment: 1 }, totalEarnings: { increment: earnings } },
    });

    // Update participant statuses
    await tx.rideParticipant.updateMany({
      where: { rideId, status: 'APPROVED' },
      data: { status: 'COMPLETED', droppedAt: new Date() },
    });

    return completedRide;
  });
}

// ── My Created Rides ──────────────────────────────────────────────────
export async function myCreatedRides(userId: string, page = 1, limit = 10) {
  const { skip, take } = paginate(page, limit);
  const [rides, total] = await Promise.all([
    prisma.ride.findMany({
      where: { creatorId: userId },
      skip, take,
      orderBy: { createdAt: 'desc' },
      include: {
        vehicle: true,
        participants: { include: { user: { select: { id: true, name: true, avatar: true } } } },
        shareRequests: { where: { status: 'PENDING' } },
        _count: { select: { participants: true } },
      },
    }),
    prisma.ride.count({ where: { creatorId: userId } }),
  ]);
  return { rides, meta: paginationMeta(total, page, limit) };
}

// ── My Joined Rides ───────────────────────────────────────────────────
export async function myJoinedRides(userId: string, page = 1, limit = 10) {
  const { skip, take } = paginate(page, limit);
  const [participants, total] = await Promise.all([
    prisma.rideParticipant.findMany({
      where: { userId },
      skip, take,
      orderBy: { createdAt: 'desc' },
      include: {
        ride: {
          include: {
            driver: { select: { id: true, name: true, avatar: true } },
            vehicle: true,
          },
        },
      },
    }),
    prisma.rideParticipant.count({ where: { userId } }),
  ]);
  return { rides: participants, meta: paginationMeta(total, page, limit) };
}

// ── Get Ride Types ────────────────────────────────────────────────────
export async function getRideTypes() {
  return prisma.rideTypeConfig.findMany({ where: { isActive: true } });
}
