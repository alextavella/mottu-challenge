import { env } from './infrastructure/config/env.config';
import { prisma } from './infrastructure/database/client';
import { setupEventConsumers } from './infrastructure/events/consumers';
import {
  getEventManager,
  shutdownEventManager,
} from './infrastructure/events/event-manager';
import { createServer } from './infrastructure/http/server';

async function start() {
  const app = createServer();

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
