import prisma from '../../config/database';
import { NotFoundError, ForbiddenError } from '../../shared/errors';
import { paginate, paginationMeta } from '../../shared/utils/helpers';

export async function getProfile(userId: string) {
  const profile = await prisma.driverProfile.findUnique({
    where: { userId },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true, avatar: true } },
      documents: true,
    },
  });
  if (!profile) throw new NotFoundError('Driver profile not found');
  const vehicle = await prisma.vehicle.findFirst({ where: { ownerId: userId, isActive: true } });
  return { ...profile, vehicle };
}

export async function updateProfile(userId: string, data: { name?: string; phone?: string; city?: string; bio?: string; address?: string }) {
  const { name, phone, city, bio } = data;
  const [user] = await Promise.all([
    prisma.user.update({ where: { id: userId }, data: { name, phone } }),
    prisma.driverProfile.update({ where: { userId }, data: { city, bio } }),
  ]);
  return user;
}

export async function updateVehicle(userId: string, data: { make?: string; model?: string; year?: number; color?: string; plate?: string; totalSeats?: number }) {
  return prisma.vehicle.updateMany({ where: { ownerId: userId, isActive: true }, data });
}

export async function updatePayoutSettings(userId: string, data: { payoutMethod?: string; payoutNumber?: string; payoutSchedule?: any }) {
  return prisma.driverProfile.update({ where: { userId }, data });
}

export async function updateWorkPreferences(userId: string, data: { preferredZones?: string; maxTripDistance?: number; airportTrips?: boolean; nightShift?: boolean }) {
  return prisma.driverProfile.update({ where: { userId }, data });
}

export async function toggleOnline(userId: string) {
  const profile = await prisma.driverProfile.findUnique({ where: { userId } });
  if (!profile) throw new NotFoundError();
  if (!profile.isApproved) throw new ForbiddenError('Account not yet approved');
  const updated = await prisma.driverProfile.update({
    where: { userId },
    data: { isOnline: !profile.isOnline },
  });
  return { isOnline: updated.isOnline };
}

export async function getEarnings(userId: string, period: 'week' | 'month' = 'week') {
  const now = new Date();
  const startDate = new Date();
  if (period === 'week') startDate.setDate(now.getDate() - 7);
  else startDate.setDate(now.getDate() - 30);

  const rides = await prisma.ride.findMany({
    where: { driverId: userId, status: 'COMPLETED', completedAt: { gte: startDate } },
    select: { completedAt: true, totalFare: true, pricePerSeat: true, totalSeats: true, availableSeats: true },
  });

  const totalEarnings = rides.reduce((sum, r) => {
    const fare = r.pricePerSeat ? r.pricePerSeat * (r.totalSeats - r.availableSeats) : (r.totalFare || 0);
    return sum + fare;
  }, 0);

  const profile = await prisma.driverProfile.findUnique({ where: { userId } });

  // Build daily breakdown
  const days = period === 'week' ? 7 : 30;
  const dailyMap: Record<string, number> = {};
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString('en-BD', { weekday: 'short', month: 'short', day: 'numeric' });
    dailyMap[key] = 0;
  }
  rides.forEach(r => {
    if (!r.completedAt) return;
    const key = r.completedAt.toLocaleDateString('en-BD', { weekday: 'short', month: 'short', day: 'numeric' });
    const fare = r.pricePerSeat ? r.pricePerSeat * (r.totalSeats - r.availableSeats) : (r.totalFare || 0);
    if (key in dailyMap) dailyMap[key] = (dailyMap[key] || 0) + fare;
  });

  const dailyBreakdown = Object.entries(dailyMap).map(([day, amount]) => ({ day, amount }));

  return {
    totalEarnings,
    totalTrips: rides.length,
    avgPerTrip: rides.length ? Math.round(totalEarnings / rides.length) : 0,
    dailyBreakdown,
    profile,
  };
}

export async function getRatings(userId: string, page = 1, limit = 10) {
  const { skip, take } = paginate(page, limit);
  const [ratings, total] = await Promise.all([
    prisma.rating.findMany({
      where: { toUserId: userId },
      skip, take,
      orderBy: { createdAt: 'desc' },
      include: { fromUser: { select: { id: true, name: true, avatar: true } } },
    }),
    prisma.rating.count({ where: { toUserId: userId } }),
  ]);
  const avg = ratings.length ? ratings.reduce((s, r) => s + r.rating, 0) / ratings.length : 0;
  return { ratings, avg: parseFloat(avg.toFixed(1)), meta: paginationMeta(total, page, limit) };
}

export async function getDocuments(userId: string) {
  const profile = await prisma.driverProfile.findUnique({ where: { userId } });
  if (!profile) throw new NotFoundError();
  return prisma.document.findMany({ where: { driverProfileId: profile.id } });
}

export async function updateDocument(userId: string, type: string, filePath: string) {
  const profile = await prisma.driverProfile.findUnique({ where: { userId } });
  if (!profile) throw new NotFoundError();
  return prisma.document.upsert({
    where: { driverProfileId_type: { driverProfileId: profile.id, type: type as any } },
    update: { filePath, status: 'PENDING', verifiedAt: null },
    create: { driverProfileId: profile.id, type: type as any, filePath, status: 'PENDING' },
  });
}

export async function getTrips(userId: string, page = 1, limit = 10) {
  const { skip, take } = paginate(page, limit);
  const [trips, total] = await Promise.all([
    prisma.ride.findMany({
      where: { driverId: userId },
      skip, take,
      orderBy: { createdAt: 'desc' },
      include: {
        participants: { include: { user: { select: { id: true, name: true, avatar: true } } } },
        ratings: { where: { toUserId: userId }, select: { rating: true } },
      },
    }),
    prisma.ride.count({ where: { driverId: userId } }),
  ]);
  return { trips, meta: paginationMeta(total, page, limit) };
}
