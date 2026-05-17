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
    console.log(`🔌 Socket connected: ${user?.name} (${user?.id})`);

    // Join a ride room — both driver and user call this with the rideId
    socket.on('join:ride', (rideId: string) => {
      socket.join(`ride:${rideId}`);
      console.log(`📍 ${user?.name} joined ride:${rideId}`);
    });

    socket.on('leave:ride', (rideId: string) => {
      socket.leave(`ride:${rideId}`);
    });

    // Driver location update — broadcast to rider in same ride room
    socket.on('driver:location', ({ rideId, lat, lng }: { rideId: string; lat: number; lng: number }) => {
      socket.to(`ride:${rideId}`).emit('driver:location', { lat, lng });
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${user?.name}`);
    });
  });

  return io;
}

export function getIO(): Server | null {
  return io;
}
