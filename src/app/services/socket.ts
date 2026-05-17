// Socket.io client singleton for UniRide
// Usage: import { socket, joinRideRoom, leaveRideRoom } from './socket'

import { io, Socket } from 'socket.io-client';
import { getAccessToken } from './api';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:3001';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const token = getAccessToken();
    socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('🔌 Socket connected');
    });
    socket.on('disconnect', () => {
      console.log('🔌 Socket disconnected');
    });
    socket.on('connect_error', (err) => {
      console.warn('Socket connection error:', err.message);
    });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function joinRideRoom(rideId: string) {
  getSocket().emit('join:ride', rideId);
}

export function leaveRideRoom(rideId: string) {
  getSocket().emit('leave:ride', rideId);
}

export function emitDriverLocation(rideId: string, lat: number, lng: number) {
  getSocket().emit('driver:location', { rideId, lat, lng });
}
