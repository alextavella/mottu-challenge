import {
  ALL_DLQ_QUEUES,
  ALL_QUEUES,
  setupEventConsumers,
} from '@/core/handlers';
import { createServer } from '@/http/server';
import { prisma } from '@/infra/database/client';
import {
  getEventManager,
  shutdownEventManager,
} from '@/infra/events/event-manager';
import { exec } from 'child_process';
import { FastifyInstance } from 'fastify';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Clears RabbitMQ queues to prevent interference from previous test runs
 */
async function clearRabbitMQQueues(): Promise<void> {
  try {
    // Get the RabbitMQ container ID
    const { stdout: containerId } = await execAsync(
      'docker ps -q --filter "name=rabbitmq"',
    );

    if (!containerId.trim()) {
      console.log('No RabbitMQ container found, skipping queue cleanup');
      return;
    }

    // First, try to delete queues (this will remove any configuration conflicts)
    for (const queue of [...ALL_QUEUES, ...ALL_DLQ_QUEUES]) {
      try {
        await execAsync(
          `docker exec ${containerId.trim()} rabbitmqctl delete_queue ${queue}`,
        );
        console.log(`Deleted queue: ${queue}`);
      } catch (error) {
        // Queue might not exist, which is fine
        console.log(`Queue ${queue} not found or already deleted`);
      }
    }

    // Also clear any remaining messages in case queues couldn't be deleted
    for (const queue of ALL_QUEUES) {
      try {
        await execAsync(
          `docker exec ${containerId.trim()} rabbitmqctl purge_queue ${queue}`,
        );
        console.log(`Cleared queue: ${queue}`);
      } catch (error) {
        // Queue might not exist, which is fine
        console.log(`Queue ${queue} not found or already empty`);
      }
    }

    console.log('RabbitMQ queues cleared successfully');
  } catch (error) {
    console.warn('Failed to clear RabbitMQ queues:', error);
    // Don't throw error as this is not critical for tests
  }
}

/**
 * Creates a simple server instance for integration tests (without events)
 * @returns Promise<FastifyInstance> - The server instance without events
 */
export async function createServerSimple(): Promise<FastifyInstance> {
  const app = createServer();

  try {
    // Test database connection
    await prisma.$connect();
    app.log.info('Test database connected successfully');

    // Wait for app to be ready
    await app.ready();

    return app;
  } catch (error) {
    app.log.error('Failed to create simple server');
    throw error;
  }
}

/**
 * Creates a server instance with event system initialized for integration tests
 * @returns Promise<FastifyInstance> - The server instance with events initialized
 */
export async function createServerWithEvents(): Promise<FastifyInstance> {
  const app = createServer();

  try {
    // Test database connection
    await prisma.$connect();
    app.log.info('Test database connected successfully');

    // Clear RabbitMQ queues before initializing event system
    // await clearRabbitMQQueues();

    // Initialize event system with test configuration
    const eventManager = getEventManager(app.log);
    await eventManager.initialize();
    app.log.info('Event system initialized successfully');

    // Setup event consumers
    setupEventConsumers(eventManager);
    app.log.info('Event consumers started successfully');

    // Wait for app to be ready
    await app.ready();

    return app;
  } catch (error) {
    app.log.error('Failed to create server with events');
    throw error;
  }
}

/**
 * Closes a simple server instance and cleans up resources
 * @param app - The Fastify instance to close
 */
export async function closeServerSimple(app: FastifyInstance): Promise<void> {
  try {
    await app.close();
    await prisma.$disconnect();
    app.log.info('Simple server closed successfully');
  } catch (error) {
    app.log.error('Error closing simple server');
    throw error;
  }
}

/**
 * Closes a server instance and cleans up resources
 * @param app - The Fastify instance to close
 */
export async function closeServerWithEvents(
  app: FastifyInstance,
): Promise<void> {
  try {
    await app.close();
    await shutdownEventManager();
    await prisma.$disconnect();
    app.log.info('Server with events closed successfully');
  } catch (error) {
    app.log.error('Error closing server with events');
    // Don't rethrow to prevent unhandled rejections in tests
  }
}
