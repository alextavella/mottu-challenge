import { createServer } from '@/infrastructure/http/server';
import { FastifyInstance } from 'fastify';
import supertest from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

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
      const requests = Array.from({ length: 5 }, () =>
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
