import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import prisma from '../../config/database';
import { RegisterDto, LoginDto, ChangePasswordDto, DriverApplyDto } from './auth.dto';
import { ConflictError, UnauthorizedError, NotFoundError, BadRequestError } from '../../shared/errors';
import { Role, VehicleType } from '@prisma/client';

function generateTokens(payload: { id: string; email: string; role: Role; name: string }) {
  const accessToken = jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as any });
  const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES_IN as any });
  return { accessToken, refreshToken };
}

function safeUser(user: any) {
  const { passwordHash, refreshToken, ...safe } = user;
  return safe;
}

export async function register(dto: RegisterDto) {
  const existing = await prisma.user.findUnique({ where: { email: dto.email } });
  if (existing) throw new ConflictError('Email already registered');

  const passwordHash = await bcrypt.hash(dto.password, 12);
  const avatar = dto.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const user = await prisma.user.create({
    data: {
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      passwordHash,
      avatar,
      role: 'USER',
      notificationPrefs: { create: {} },
    },
  });

  const tokens = generateTokens({ id: user.id, email: user.email, role: user.role, name: user.name });
  await prisma.user.update({ where: { id: user.id }, data: { refreshToken: tokens.refreshToken } });

  return { user: safeUser(user), ...tokens };
}

export async function login(dto: LoginDto) {
  const user = await prisma.user.findUnique({ where: { email: dto.email } });
  if (!user) throw new UnauthorizedError('Invalid email or password');
  if (user.status === 'SUSPENDED') throw new UnauthorizedError('Account suspended. Contact support.');

  const valid = await bcrypt.compare(dto.password, user.passwordHash);
  if (!valid) throw new UnauthorizedError('Invalid email or password');

  const tokens = generateTokens({ id: user.id, email: user.email, role: user.role, name: user.name });
  await prisma.user.update({ where: { id: user.id }, data: { refreshToken: tokens.refreshToken } });

  return { user: safeUser(user), ...tokens };
}

export async function refresh(token: string) {
  let decoded: any;
  try {
    decoded = jwt.verify(token, env.JWT_REFRESH_SECRET);
  } catch {
    throw new UnauthorizedError('Invalid refresh token');
  }
  const user = await prisma.user.findUnique({ where: { id: decoded.id } });
  if (!user || user.refreshToken !== token) throw new UnauthorizedError('Token revoked');

  const tokens = generateTokens({ id: user.id, email: user.email, role: user.role, name: user.name });
  await prisma.user.update({ where: { id: user.id }, data: { refreshToken: tokens.refreshToken } });
  return tokens;
}

export async function logout(userId: string) {
  await prisma.user.update({ where: { id: userId }, data: { refreshToken: null } });
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { driverProfile: true },
  });
  if (!user) throw new NotFoundError('User not found');
  return safeUser(user);
}

export async function changePassword(userId: string, dto: ChangePasswordDto) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError();
  const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
  if (!valid) throw new BadRequestError('Current password is incorrect');
  const passwordHash = await bcrypt.hash(dto.newPassword, 12);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
}

export async function driverApply(dto: DriverApplyDto, files: Express.Multer.File[]) {
  const existing = await prisma.user.findUnique({ where: { email: dto.email } });
  if (existing) throw new ConflictError('Email already registered');

  const passwordHash = await bcrypt.hash(dto.password, 12);
  const avatar = dto.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const user = await prisma.user.create({
    data: {
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      passwordHash,
      avatar,
      role: 'DRIVER',
      status: 'PENDING',
      driverProfile: {
        create: {
          nid: dto.nid,
          city: dto.city,
        },
      },
      notificationPrefs: { create: {} },
    },
    include: { driverProfile: true },
  });

  // Create vehicle
  await prisma.vehicle.create({
    data: {
      ownerId: user.id,
      make: dto.vehicleMake,
      model: dto.vehicleModel,
      year: dto.vehicleYear,
      color: dto.vehicleColor,
      type: dto.vehicleType as VehicleType,
      plate: dto.vehiclePlate,
      totalSeats: dto.vehicleSeats,
      status: 'UNDER_REVIEW',
    },
  });

  // Save uploaded documents
  if (files?.length && user.driverProfile) {
    const docTypes = ['NID', 'LICENCE', 'REGISTRATION', 'FITNESS', 'INSURANCE'];
    for (let i = 0; i < files.length && i < docTypes.length; i++) {
      await prisma.document.create({
        data: {
          driverProfileId: user.driverProfile.id,
          type: docTypes[i] as any,
          filePath: files[i].path,
          status: 'PENDING',
        },
      });
    }
  }

  const tokens = generateTokens({ id: user.id, email: user.email, role: user.role, name: user.name });
  await prisma.user.update({ where: { id: user.id }, data: { refreshToken: tokens.refreshToken } });

  return { user: safeUser(user), ...tokens };
}
