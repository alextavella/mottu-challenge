import { env } from './config/env';
import { prisma } from './database/client';
import { createApp } from './http/server';

async function start() {
  const app = createApp();

  try {
    // Test database connection
    await prisma.$connect();
    app.log.info('Database connected successfully');

    // Start server
    await app.listen({
      port: env.PORT,
      host: '0.0.0.0',
    });

    app.log.info(`Server listening on port ${env.PORT}`);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

start();
