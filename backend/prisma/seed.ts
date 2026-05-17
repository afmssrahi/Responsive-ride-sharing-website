import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding UniRide database...');

  // ── Password ───────────────────────────────────────────────────
  const password = await bcrypt.hash('demo123', 12);

  // ── Admin ──────────────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: 'admin@uniride.com.bd' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@uniride.com.bd',
      passwordHash: password,
      role: 'ADMIN',
      avatar: 'AD',
      status: 'ACTIVE',
      notificationPrefs: { create: {} },
    },
  });

  // ── Passenger User ─────────────────────────────────────────────
  const user = await prisma.user.upsert({
    where: { email: 'farhan@example.com' },
    update: {},
    create: {
      name: 'Farhan Hossain',
      email: 'farhan@example.com',
      phone: '+880 1700-210384',
      passwordHash: password,
      role: 'USER',
      avatar: 'FH',
      status: 'ACTIVE',
      notificationPrefs: { create: { rideUpdates: true, driverArrival: true, receipts: true, promotions: false } },
      paymentMethods: {
        create: [
          { type: 'BKASH', details: { number: '01700-210384' }, isDefault: true },
          { type: 'NAGAD', details: { number: '01800-210384' }, isDefault: false },
          { type: 'CARD', details: { last4: '4242', expiry: '08/27', brand: 'Visa' }, isDefault: false },
        ],
      },
      savedPlaces: {
        create: [
          { label: 'Home', address: 'House 12, Road 5, Dhanmondi, Dhaka 1205', lat: 23.7461, lng: 90.3742, icon: 'Home' },
          { label: 'Office', address: 'Bangladesh Bank Building, Motijheel, Dhaka 1000', lat: 23.7334, lng: 90.4163, icon: 'MapPin' },
          { label: 'Gym', address: 'Gulshan Shopping Center, Gulshan-1, Dhaka 1212', lat: 23.7805, lng: 90.4160, icon: 'Bookmark' },
        ],
      },
    },
  });

  // ── Driver ─────────────────────────────────────────────────────
  const driver = await prisma.user.upsert({
    where: { email: 'rasel@example.com' },
    update: {},
    create: {
      name: 'Rasel Miah',
      email: 'rasel@example.com',
      phone: '+880 1700-847293',
      passwordHash: password,
      role: 'DRIVER',
      avatar: 'RM',
      status: 'ACTIVE',
      notificationPrefs: { create: {} },
      driverProfile: {
        create: {
          city: 'Dhaka',
          nid: 'BD-1990-123456',
          rating: 4.9,
          totalRides: 312,
          totalEarnings: 28410,
          isApproved: true,
          isOnline: true,
          acceptanceRate: 92,
          completionRate: 96,
          preferredZones: 'Gulshan, Banani, Baridhara',
          maxTripDistance: 30,
          airportTrips: true,
          nightShift: false,
          payoutMethod: 'bKash',
          payoutNumber: '01700-847293',
          payoutSchedule: 'WEEKLY',
          verifiedAt: new Date('2024-11-01'),
        },
      },
    },
  });

  // ── Driver's vehicle ───────────────────────────────────────────
  await prisma.vehicle.upsert({
    where: { plate: 'Dhaka Metro-G 11-2345' },
    update: {},
    create: {
      ownerId: driver.id,
      make: 'Toyota',
      model: 'Allion',
      year: 2019,
      color: 'Silver',
      type: 'SEDAN',
      plate: 'Dhaka Metro-G 11-2345',
      totalSeats: 4,
      status: 'ACTIVE',
    },
  });

  // ── Extra users for admin dashboard ───────────────────────────
  const extraUsers = [
    { name: 'Tahmina Begum', email: 'tahmina@example.com', avatar: 'TB' },
    { name: 'Sabbir Ahmed', email: 'sabbir@example.com', avatar: 'SA' },
    { name: 'Roksana Parvin', email: 'roksana@example.com', avatar: 'RP' },
    { name: 'Arif Billah', email: 'arif@example.com', avatar: 'AB' },
    { name: 'Aminul Islam', email: 'aminul@example.com', avatar: 'AI' },
  ];
  for (const u of extraUsers) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { ...u, passwordHash: password, role: 'USER', status: 'ACTIVE', notificationPrefs: { create: {} } },
    });
  }

  // ── Ride Type Configs ──────────────────────────────────────────
  const rideTypes = [
    { name: 'Economy', description: 'Comfortable, affordable rides', baseFare: 80, pricePerKm: 15, capacity: 3, eta: '3 min', features: ['Standard vehicle', 'AC'] },
    { name: 'Comfort', description: 'Newer, more comfortable cars', baseFare: 120, pricePerKm: 20, capacity: 3, eta: '5 min', features: ['Premium vehicle', 'AC', 'USB charging'] },
    { name: 'XL', description: 'Up to 6 passengers', baseFare: 160, pricePerKm: 25, capacity: 6, eta: '7 min', features: ['Minivan/SUV', 'AC', 'Extra space'] },
    { name: 'Swift', description: 'Fastest option available', baseFare: 60, pricePerKm: 12, capacity: 3, eta: '2 min', features: ['Nearest driver', 'AC'] },
  ];
  for (const rt of rideTypes) {
    await prisma.rideTypeConfig.upsert({
      where: { name: rt.name },
      update: {},
      create: { ...rt, features: rt.features, isActive: true },
    });
  }

  // ── Sample Rides ───────────────────────────────────────────────
  const vehicle = await prisma.vehicle.findFirst({ where: { ownerId: driver.id } });

  const completedRides = [
    { from: 'Gulshan-1', fLat: 23.7805, fLng: 90.4160, to: 'Shahjalal Airport', tLat: 23.8434, tLng: 90.3978, fare: 380 },
    { from: 'Motijheel', fLat: 23.7334, fLng: 90.4163, to: 'Dhanmondi', tLat: 23.7461, tLng: 90.3742, fare: 280 },
    { from: 'Uttara', fLat: 23.8759, fLng: 90.3795, to: 'Banani', tLat: 23.7937, tLng: 90.4066, fare: 190 },
  ];

  for (let i = 0; i < completedRides.length; i++) {
    const r = completedRides[i];
    const code = `SR-SEED${i + 1}`;
    const exists = await prisma.ride.findUnique({ where: { rideCode: code } });
    if (!exists) {
      await prisma.ride.create({
        data: {
          rideCode: code,
          type: 'ON_DEMAND',
          status: 'COMPLETED',
          creatorId: user.id,
          driverId: driver.id,
          vehicleId: vehicle?.id,
          pickupLocation: r.from, pickupLat: r.fLat, pickupLng: r.fLng,
          dropoffLocation: r.to, dropoffLat: r.tLat, dropoffLng: r.tLng,
          totalFare: r.fare, baseFare: 80,
          completedAt: new Date(Date.now() - i * 86400000),
        },
      });
    }
  }

  // ── Sample Shared Ride ─────────────────────────────────────────
  const sharedExists = await prisma.ride.findUnique({ where: { rideCode: 'SR-SHARED1' } });
  if (!sharedExists) {
    await prisma.ride.create({
      data: {
        rideCode: 'SR-SHARED1',
        type: 'DRIVER_CREATED_SHARED',
        status: 'CONFIRMED',
        creatorId: driver.id,
        driverId: driver.id,
        vehicleId: vehicle?.id,
        pickupLocation: 'Dhaka (Gulshan)', pickupLat: 23.7805, pickupLng: 90.4160,
        dropoffLocation: 'Chittagong (Agrabad)', dropoffLat: 22.3260, dropoffLng: 91.8187,
        departureTime: new Date(Date.now() + 2 * 3600000),
        totalSeats: 4, availableSeats: 3,
        pricePerSeat: 800,
        sharingEnabled: true,
        notes: 'Comfortable Toyota Allion. Departure at 10 AM sharp. One stop in Comilla.',
      },
    });
  }

  // ── Platform Settings ──────────────────────────────────────────
  const settings = [
    { key: 'platform_fee_percent', value: '20' },
    { key: 'min_fare_bdt', value: '80' },
    { key: 'base_fare_bdt', value: '80' },
    { key: 'price_per_km', value: '18' },
    { key: 'surge_multiplier_max', value: '3.0' },
    { key: 'cancellation_fee_bdt', value: '30' },
    { key: 'driver_payout_day', value: 'Monday' },
    { key: 'support_phone', value: '09678-UNIRIDE' },
    { key: 'support_email', value: 'support@uniride.com.bd' },
  ];
  for (const s of settings) {
    await prisma.platformSetting.upsert({
      where: { key: s.key },
      update: { value: s.value, updatedBy: admin.id },
      create: { key: s.key, value: s.value, updatedBy: admin.id },
    });
  }

  // ── Admin Activity Logs ────────────────────────────────────────
  const logEntries = [
    { action: 'Approved driver account', target: 'Driver', type: 'success', details: 'Driver: Rasel Miah' },
    { action: 'Updated platform settings', target: 'PlatformSetting', type: 'neutral', details: 'Fee: 20%, Min: BDT 80' },
    { action: 'Suspended user account', target: 'User', type: 'warning', details: 'User flagged for suspicious activity' },
  ];
  for (const log of logEntries) {
    await prisma.adminActivityLog.create({ data: { adminId: admin.id, ...log } });
  }

  // ── Driver Ratings ─────────────────────────────────────────────
  const rides = await prisma.ride.findMany({ where: { driverId: driver.id, status: 'COMPLETED' } });
  if (rides.length > 0) {
    const ratingData = [
      { rating: 5, comment: 'Very good driver. Knows the roads well, arrived on time.' },
      { rating: 5, comment: 'Car was clean, arrived on time.' },
      { rating: 4, comment: 'Good ride, but took a slight detour.' },
    ];
    for (let i = 0; i < Math.min(rides.length, ratingData.length); i++) {
      const existing = await prisma.rating.findFirst({ where: { rideId: rides[i].id } });
      if (!existing) {
        await prisma.rating.create({
          data: {
            rideId: rides[i].id,
            fromUserId: user.id,
            toUserId: driver.id,
            ...ratingData[i],
          },
        });
      }
    }
  }

  console.log('✅ Seed complete!');
  console.log('');
  console.log('Demo accounts:');
  console.log('  Admin   → admin@uniride.com.bd / demo123');
  console.log('  User    → farhan@example.com / demo123');
  console.log('  Driver  → rasel@example.com / demo123');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
