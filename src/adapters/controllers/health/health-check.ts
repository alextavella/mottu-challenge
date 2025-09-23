import { prisma } from '@/infrastructure/database/client';
import { getEventManager } from '@/infrastructure/events/event-manager';
import { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

const serviceStatusSchema = z.object({
  status: z.enum(['healthy', 'unhealthy', 'unknown']),
  message: z.string().optional(),
  responseTime: z.number().optional(),
});

const healthResponseSchema = z.object({
  status: z.enum(['healthy', 'degraded', 'unhealthy']),
  timestamp: z.string().datetime(),
  version: z.string(),
  services: z.object({
    database: serviceStatusSchema,
    rabbitmq: serviceStatusSchema,
  }),
});

async function checkDatabaseHealth(): Promise<{
  status: 'healthy' | 'unhealthy';
  message?: string;
  responseTime: number;
}> {
  const startTime = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1`;
    const responseTime = Date.now() - startTime;

    return {
      status: 'healthy',
      responseTime,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      status: 'unhealthy',
      message:
        error instanceof Error ? error.message : 'Database connection failed',
      responseTime,
    };
  }
}

async function checkRabbitMQHealth(): Promise<{
  status: 'healthy' | 'unhealthy';
  message?: string;
  responseTime: number;
}> {
  const startTime = Date.now();

  try {
    const eventManager = getEventManager();
    const isConnected = eventManager.isConnected();
    const responseTime = Date.now() - startTime;

    if (isConnected) {
      return {
        status: 'healthy',
        responseTime,
      };
    } else {
      return {
        status: 'unhealthy',
        message: 'RabbitMQ connection not established',
        responseTime,
      };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'RabbitMQ check failed',
      responseTime,
    };
  }
}

function determineOverallStatus(
  services: Record<string, { status: string }>,
): 'healthy' | 'degraded' | 'unhealthy' {
  const statuses = Object.values(services).map((service) => service.status);

  if (statuses.every((status) => status === 'healthy')) {
    return 'healthy';
  }

  if (statuses.some((status) => status === 'healthy')) {
    return 'degraded';
  }

  return 'unhealthy';
}

export async function healthCheck(fastify: FastifyInstance) {
  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/health',
    schema: {
      description: 'Verifica o status da aplicação e serviços dependentes',
      tags: ['health'],
      summary: 'Health check completo',
      response: {
        200: healthResponseSchema,
        503: healthResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const timestamp = new Date().toISOString();

      // Execute health checks in parallel
      const [databaseHealth, rabbitmqHealth] = await Promise.all([
        checkDatabaseHealth(),
        checkRabbitMQHealth(),
      ]);

      const services = {
        database: databaseHealth,
        rabbitmq: rabbitmqHealth,
      };

      const overallStatus = determineOverallStatus(services);

      const response = {
        status: overallStatus,
        timestamp,
        version: '1.0.0',
        services,
      };

      // Return appropriate HTTP status code
      const statusCode = overallStatus === 'healthy' ? 200 : 503;

      reply.code(statusCode).send(response);
    },
  });
}
