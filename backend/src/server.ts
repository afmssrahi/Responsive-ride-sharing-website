import './config/env';
import app from './app';
import { env } from './config/env';
import prisma from './config/database';

async function main() {
  // Test DB connection
  try {
    await prisma.$connect();
    console.log('✅ Database connected');
  } catch (err) {
    console.error('❌ Database connection failed:', err);
    process.exit(1);
  }

  app.listen(env.PORT, () => {
    console.log(`🚀 SwiftRide API running on http://localhost:${env.PORT}`);
    console.log(`📦 Environment: ${env.NODE_ENV}`);
    console.log(`🔗 Health check: http://localhost:${env.PORT}/health`);
  });
}

main();
