import prisma from '../../config/database';
import { NotFoundError } from '../../shared/errors';
import { paginate, paginationMeta } from '../../shared/utils/helpers';

export async function getOverview() {
  const [totalUsers, totalDrivers, totalRides, recentRides] = await Promise.all([
    prisma.user.count({ where: { role: 'USER' } }),
    prisma.user.count({ where: { role: 'DRIVER' } }),
    prisma.ride.count(),
    prisma.ride.count({ where: { status: 'COMPLETED' } }),
  ]);

  const activeDrivers = await prisma.driverProfile.count({ where: { isOnline: true } });
  const pendingDrivers = await prisma.user.count({ where: { role: 'DRIVER', status: 'PENDING' } });

  return { totalUsers, totalDrivers, totalRides, completedRides: recentRides, activeDrivers, pendingDrivers };
}

export async function getUsers(page = 1, limit = 20, search?: string, role?: string) {
  const { skip, take } = paginate(page, limit);
  const where: any = {
    ...(role ? { role: role as any } : { role: { in: ['USER', 'DRIVER'] } }),
    ...(search && { OR: [{ name: { contains: search } }, { email: { contains: search } }] }),
  };
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where, skip, take,
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, email: true, phone: true, role: true, status: true, avatar: true, createdAt: true },
    }),
    prisma.user.count({ where }),
  ]);
  return { users, meta: paginationMeta(total, page, limit) };
}

export async function updateUserStatus(adminId: string, userId: string, status: string) {
  const user = await prisma.user.update({ where: { id: userId }, data: { status: status as any } });
  await prisma.adminActivityLog.create({
    data: {
      adminId,
      action: `${status === 'SUSPENDED' ? 'Suspended' : 'Activated'} user account`,
      target: 'User',
      targetId: userId,
      type: status === 'SUSPENDED' ? 'warning' : 'success',
      details: `User: ${user.name} (${user.email})`,
    },
  });
  return user;
}

export async function getDrivers(page = 1, limit = 20, search?: string) {
  const { skip, take } = paginate(page, limit);
  const where: any = {
    role: 'DRIVER',
    ...(search && { OR: [{ name: { contains: search } }, { email: { contains: search } }] }),
  };
  const [drivers, total] = await Promise.all([
    prisma.user.findMany({
      where, skip, take,
      orderBy: { createdAt: 'desc' },
      include: {
        driverProfile: { select: { isApproved: true, isOnline: true, rating: true, totalRides: true } },
        vehicles: { where: { isActive: true }, take: 1 },
      },
    }),
    prisma.user.count({ where }),
  ]);
  return { drivers, meta: paginationMeta(total, page, limit) };
}

export async function approveDriver(adminId: string, userId: string, approved: boolean) {
  const [user] = await Promise.all([
    prisma.user.update({
      where: { id: userId },
      data: { status: approved ? 'ACTIVE' : 'SUSPENDED' },
    }),
    prisma.driverProfile.update({
      where: { userId },
      data: { isApproved: approved, verifiedAt: approved ? new Date() : null },
    }),
  ]);
  await prisma.adminActivityLog.create({
    data: {
      adminId,
      action: approved ? 'Approved driver account' : 'Revoked driver approval',
      target: 'Driver',
      targetId: userId,
      type: approved ? 'success' : 'warning',
      details: `Driver: ${user.name}`,
    },
  });
  return user;
}

export async function getRides(page = 1, limit = 20, status?: string) {
  const { skip, take } = paginate(page, limit);
  const where: any = status ? { status: status as any } : {};
  const [rides, total] = await Promise.all([
    prisma.ride.findMany({
      where, skip, take,
      orderBy: { createdAt: 'desc' },
      include: {
        creator: { select: { id: true, name: true, avatar: true } },
        driver: { select: { id: true, name: true, avatar: true } },
        vehicle: true,
        _count: { select: { participants: true } },
      },
    }),
    prisma.ride.count({ where }),
  ]);
  return { rides, meta: paginationMeta(total, page, limit) };
}

export async function getAnalytics() {
  const days = 7;
  const data = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));
    const ridesCount = await prisma.ride.count({
      where: { createdAt: { gte: startOfDay, lte: endOfDay } },
    });
    data.push({ day: startOfDay.toLocaleDateString('en-BD', { weekday: 'short' }), rides: ridesCount, revenue: ridesCount * 280 });
  }
  return data;
}

export async function getSettings() {
  const settings = await prisma.platformSetting.findMany();
  return Object.fromEntries(settings.map(s => [s.key, s.value]));
}

export async function updateSettings(adminId: string, data: Record<string, string>) {
  const updates = Object.entries(data).map(([key, value]) =>
    prisma.platformSetting.upsert({
      where: { key },
      update: { value, updatedBy: adminId },
      create: { key, value, updatedBy: adminId },
    })
  );
  await Promise.all(updates);
  await prisma.adminActivityLog.create({
    data: { adminId, action: 'Updated platform settings', target: 'PlatformSetting', type: 'neutral' },
  });
}

export async function getActivityLog(page = 1, limit = 20) {
  const { skip, take } = paginate(page, limit);
  const [logs, total] = await Promise.all([
    prisma.adminActivityLog.findMany({
      skip, take,
      orderBy: { createdAt: 'desc' },
      include: { admin: { select: { id: true, name: true, avatar: true } } },
    }),
    prisma.adminActivityLog.count(),
  ]);
  return { logs, meta: paginationMeta(total, page, limit) };
}
