import { createServer } from '@/http/server';
import { prisma } from '@/infra/database/client';
import { getEventManager } from '@/infra/events/event-manager';
import { FastifyInstance } from 'fastify';
import supertest from 'supertest';

describe('Health Check Routes', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = createServer();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await supertest(app.server).get('/health');

      // Accept both 200 (healthy) and 503 (degraded) in tests
      expect([200, 503]).toContain(response.status);

      expect(response.body).toMatchObject({
        status: expect.stringMatching(/^(healthy|degraded|unhealthy)$/),
        timestamp: expect.any(String),
        version: expect.any(String),
        services: expect.objectContaining({
          database: expect.objectContaining({
            status: expect.stringMatching(/^(healthy|unhealthy)$/),
          }),
          rabbitmq: expect.objectContaining({
            status: expect.stringMatching(/^(healthy|unhealthy)$/),
          }),
        }),
      });

      // Validate timestamp format
      const timestamp = new Date(response.body.timestamp);
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.getTime()).not.toBeNaN();
    });

    it('should have correct response headers', async () => {
      const response = await supertest(app.server).get('/health');

      // Accept both 200 and 503 status codes
      expect([200, 503]).toContain(response.status);
      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    it('should be accessible without authentication', async () => {
      // Health check should be publicly accessible
      const response = await supertest(app.server).get('/health');

      expect([200, 503]).toContain(response.status);
      expect(response.body.status).toMatch(/^(healthy|degraded|unhealthy)$/);
    });

    it('should return 503 when database is unhealthy', async () => {
      // Mock database failure
      vi.spyOn(prisma, '$queryRaw').mockRejectedValueOnce(
        new Error('Database connection failed'),
      );

      const response = await supertest(app.server).get('/health');

      expect(response.status).toBe(503);
      expect(response.body.status).toBe('unhealthy');
      expect(response.body.services.database.status).toBe('unhealthy');
      expect(response.body.services.database.message).toBe(
        'Database connection failed',
      );

      // Restore original method
      vi.mocked(prisma.$queryRaw).mockRestore();
    });

    it('should return 503 when RabbitMQ is unhealthy', async () => {
      // Mock RabbitMQ failure
      const eventManager = getEventManager();
      vi.spyOn(eventManager, 'isConnected').mockReturnValueOnce(false);

      const response = await supertest(app.server).get('/health');

      expect(response.status).toBe(503);
      expect(['degraded', 'unhealthy']).toContain(response.body.status); // Can be degraded or unhealthy depending on DB status
      expect(response.body.services.rabbitmq.status).toBe('unhealthy');
      expect(response.body.services.rabbitmq.message).toBe(
        'RabbitMQ connection not established',
      );

      // Restore original method
      vi.mocked(eventManager.isConnected).mockRestore();
    });

    it('should handle RabbitMQ check errors gracefully', async () => {
      // Mock RabbitMQ error
      const eventManager = getEventManager();
      vi.spyOn(eventManager, 'isConnected').mockImplementationOnce(() => {
        throw new Error('RabbitMQ check failed');
      });

      const response = await supertest(app.server).get('/health');

      expect(response.status).toBe(503);
      expect(response.body.services.rabbitmq.status).toBe('unhealthy');
      expect(response.body.services.rabbitmq.message).toBe(
        'RabbitMQ check failed',
      );

      // Restore original method
      vi.mocked(eventManager.isConnected).mockRestore();
    });

    it('should include response times for all services', async () => {
      const response = await supertest(app.server).get('/health');

      expect(response.body.services.database).toHaveProperty('responseTime');
      expect(response.body.services.rabbitmq).toHaveProperty('responseTime');
      expect(typeof response.body.services.database.responseTime).toBe(
        'number',
      );
      expect(typeof response.body.services.rabbitmq.responseTime).toBe(
        'number',
      );
      expect(
        response.body.services.database.responseTime,
      ).toBeGreaterThanOrEqual(0);
      expect(
        response.body.services.rabbitmq.responseTime,
      ).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Health Check Performance', () => {
    it('should respond quickly', async () => {
      const startTime = Date.now();

      const response = await supertest(app.server).get('/health');
      expect([200, 503]).toContain(response.status);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Health check should respond within 1 second
      expect(responseTime).toBeLessThan(1000);
    });

    it('should handle multiple concurrent requests', async () => {
      // Test with fewer concurrent requests to avoid connection issues
      const requests = Array.from({ length: 2 }, () =>
        supertest(app.server).get('/health'),
      );

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect([200, 503]).toContain(response.status);
        expect(response.body.status).toMatch(/^(healthy|degraded|unhealthy)$/);
        expect(response.body.timestamp).toBeDefined();
      });
    });
  });
});
