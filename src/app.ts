import { env } from './config/env';
import { prisma } from './database/client';
import { createApp } from './http/server';
import { getEventManager, shutdownEventManager } from './lib/events';
import { setupEventConsumers } from './message/consumers';

async function start() {
  const app = createApp();

  try {
    // Test database connection
    await prisma.$connect();
    app.log.info('Database connected successfully');

    // Initialize event system
    const eventManager = getEventManager();
    await eventManager.initialize();
    app.log.info('Event system initialized successfully');

    // Setup event consumers
    setupEventConsumers();
    app.log.info('Event consumers started successfully');

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
  await shutdownEventManager();
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await shutdownEventManager();
  await prisma.$disconnect();
  process.exit(0);
});

start();
