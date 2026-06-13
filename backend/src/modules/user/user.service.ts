import prisma from '../../config/database';
import { NotFoundError } from '../../shared/errors';
import { paginate, paginationMeta } from '../../shared/utils/helpers';

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { notificationPrefs: true },
  });
  if (!user) throw new NotFoundError();
  const { passwordHash, refreshToken, ...safe } = user as any;
  const stats = {
    totalRides: await prisma.rideParticipant.count({ where: { userId, status: 'COMPLETED' } }),
    totalSpent: 0, // Future: sum from payments
    rating: 4.8,
  };
  return { ...safe, stats };
}

export async function updateProfile(userId: string, data: { name?: string; phone?: string }) {
  const user = await prisma.user.update({ where: { id: userId }, data });
  const { passwordHash, refreshToken, ...safe } = user as any;
  return safe;
}

export async function getRideHistory(userId: string, page = 1, limit = 10) {
  const { skip, take } = paginate(page, limit);
  const [rides, total] = await Promise.all([
    prisma.ride.findMany({
      where: {
        OR: [
          { creatorId: userId },
          { participants: { some: { userId } } },
        ],
      },
      skip, take,
      orderBy: { createdAt: 'desc' },
      include: {
        driver: { select: { id: true, name: true, avatar: true } },
        vehicle: true,
        participants: { select: { userId: true, seatsBooked: true, fareAmount: true } },
        ratings: { where: { fromUserId: userId } },
      },
    }),
    prisma.ride.count({
      where: { OR: [{ creatorId: userId }, { participants: { some: { userId } } }] },
    }),
  ]);
  return { rides, meta: paginationMeta(total, page, limit) };
}

export async function getSavedPlaces(userId: string) {
  return prisma.savedPlace.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
}

export async function addSavedPlace(userId: string, data: { label: string; address: string; lat?: number; lng?: number; icon?: string }) {
  return prisma.savedPlace.create({ data: { ...data, userId } });
}

export async function deleteSavedPlace(userId: string, placeId: string) {
  const place = await prisma.savedPlace.findFirst({ where: { id: placeId, userId } });
  if (!place) throw new NotFoundError('Place not found');
  return prisma.savedPlace.delete({ where: { id: placeId } });
}

export async function getPaymentMethods(userId: string) {
  return prisma.paymentMethod.findMany({ where: { userId }, orderBy: { isDefault: 'desc' } });
}

export async function addPaymentMethod(userId: string, data: { type: string; details: any }) {
  return prisma.paymentMethod.create({ data: { userId, type: data.type as any, details: data.details } });
}

export async function setDefaultPayment(userId: string, methodId: string) {
  const method = await prisma.paymentMethod.findFirst({ where: { id: methodId, userId } });
  if (!method) throw new NotFoundError('Payment method not found');
  await prisma.$transaction([
    prisma.paymentMethod.updateMany({ where: { userId }, data: { isDefault: false } }),
    prisma.paymentMethod.update({ where: { id: methodId }, data: { isDefault: true } }),
  ]);
}

export async function deletePaymentMethod(userId: string, methodId: string) {
  const method = await prisma.paymentMethod.findFirst({ where: { id: methodId, userId } });
  if (!method) throw new NotFoundError('Payment method not found');
  return prisma.paymentMethod.delete({ where: { id: methodId } });
}

export async function getNotificationPrefs(userId: string) {
  return prisma.notificationPreference.findUnique({ where: { userId } });
}

export async function updateNotificationPrefs(userId: string, data: any) {
  return prisma.notificationPreference.upsert({
    where: { userId },
    update: data,
    create: { userId, ...data },
  });
}
