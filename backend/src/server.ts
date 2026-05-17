import './config/env';
import http from 'http';
import app from './app';
import { env } from './config/env';
import prisma from './config/database';
import { initSocket } from './config/socket';

async function main() {
  // Test DB connection
  try {
    await prisma.$connect();
    console.log('✅ Database connected');
  } catch (err) {
    console.error('❌ Database connection failed:', err);
    process.exit(1);
  }

  // Create HTTP server and attach Socket.io
  const httpServer = http.createServer(app);
  initSocket(httpServer);

  httpServer.listen(env.PORT, () => {
    console.log(`🚀 UniRide API running on http://localhost:${env.PORT}`);
    console.log(`📦 Environment: ${env.NODE_ENV}`);
    console.log(`🔗 Health check: http://localhost:${env.PORT}/health`);
    console.log(`🔌 Socket.io ready`);
  });
}

main();

