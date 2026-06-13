import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { env } from './env';

let io: Server | null = null;

export function initSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: env.FRONTEND_URL,
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }
    try {
      const decoded = jwt.verify(token as string, env.JWT_SECRET);
      (socket as any).user = decoded;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user;
    console.log(`🔌 Socket connected: ${user?.name} (${user?.id}) role=${user?.role}`);

    // ── Auto-join driver to the global online-drivers room ────────────────
    if (user?.role === 'DRIVER') {
      socket.join('drivers:online');
      console.log(`🚗 Driver ${user.name} joined drivers:online room`);
    }

    // ── Auto-join all users to users:online room for offer broadcasts ───────
    if (user?.role === 'USER') {
      socket.join('users:online');
    }

    // ── User also joins their personal room for direct notifications ──────
    if (user?.id) {
      socket.join(`user:${user.id}`);
    }

    // ── Join a ride room — both driver and user call this with the rideId ─
    socket.on('join:ride', (rideId: string) => {
      socket.join(`ride:${rideId}`);
      console.log(`📍 ${user?.name} joined ride:${rideId}`);
    });

    socket.on('leave:ride', (rideId: string) => {
      socket.leave(`ride:${rideId}`);
    });

    // ── Driver location update — broadcast to rider in same ride room ─────
    socket.on('driver:location', ({ rideId, lat, lng }: { rideId: string; lat: number; lng: number }) => {
      socket.to(`ride:${rideId}`).emit('driver:location', { lat, lng });
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${user?.name}`);
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}

// ── Broadcast a new ON_DEMAND ride request to all online drivers ──────────────
export function broadcastRideRequest(ride: {
  id: string;
  rideCode: string;
  pickupLocation: string;
  pickupLat: number;
  pickupLng: number;
  dropoffLocation: string;
  dropoffLat: number;
  dropoffLng: number;
  totalFare?: number | null;
  totalSeats: number;
  createdAt: Date;
  creator: { id: string; name: string; avatar: string | null };
}) {
  if (!io) return;
  io.to('drivers:online').emit('ride:new_request', ride);
}

// ── Broadcast seat availability update to a ride room ────────────────────────
export function broadcastSeatUpdate(rideId: string, payload: {
  availableSeats: number;
  totalSeats: number;
  requestId?: string;
  status?: string;
}) {
  if (!io) return;
  io.to(`ride:${rideId}`).emit('ride:seat_update', payload);
}

// ── Notify a specific user ────────────────────────────────────────────────────
function notifyUser(userId: string, event: string, data: any) {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, data);
}

// ── Broadcast a driver offer to all online users ────────────────────────────
export function broadcastToUsers(event: string, data: any) {
  if (!io) return;
  io.to('users:online').emit(event, data);
}

export { notifyUser };
