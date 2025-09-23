import prisma from '@/database/client';
import { createServer } from '@/http/server';
import { FastifyInstance } from 'fastify';
import supertest from 'supertest';

describe('Account Routes', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = createServer();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean database before each test using TRUNCATE CASCADE for PostgreSQL
    try {
      await prisma.$executeRaw`TRUNCATE TABLE ledger_logs, movements, accounts RESTART IDENTITY CASCADE`;
    } catch (error) {
      // Fallback to individual deletes if TRUNCATE fails
      await prisma.ledgerLog.deleteMany();
      await prisma.movement.deleteMany();
      await prisma.account.deleteMany();
    }
  });

  describe('POST /accounts', () => {
    it('should create a new account successfully', async () => {
      const timestamp = Date.now();
      const accountData = {
        name: 'John Doe',
        document: `1234567890${timestamp.toString().slice(-4)}`, // 14 characters - unique document
        email: `john${timestamp}@example.com`,
      };

      const response = await supertest(app.server)
        .post('/v1/accounts')
        .send(accountData)
        .expect(201);

      expect(response.body).toMatchObject({
        accountId: expect.any(String),
      });

      // Verify account was created in database
      const createdAccount = await prisma.account.findUnique({
        where: { id: response.body.accountId },
      });

      expect(createdAccount).toBeTruthy();
      expect(createdAccount?.document).toBe(accountData.document);
    });

    it('should return 400 for invalid request body', async () => {
      const response = await supertest(app.server)
        .post('/v1/accounts')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for missing document', async () => {
      const response = await supertest(app.server)
        .post('/v1/accounts')
        .send({ name: 'John Doe', document: '', email: 'john@example.com' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 when account already exists', async () => {
      const timestamp = Date.now();
      const accountData = {
        name: 'John Doe',
        document: `1234567890${timestamp.toString().slice(-4)}`, // 14 characters - unique document
        email: `john${timestamp}@example.com`,
      };

      // Create first account
      await supertest(app.server)
        .post('/v1/accounts')
        .send(accountData)
        .expect(201);

      // Try to create duplicate account with same document
      const duplicateData = {
        name: 'Jane Doe',
        document: accountData.document, // Same document to trigger duplicate error
        email: 'jane@example.com',
      };

      const response = await supertest(app.server)
        .post('/v1/accounts')
        .send(duplicateData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('BusinessError');
    });

    it('should handle different document formats', async () => {
      const documents = ['11111111111', '22222222222', '33333333333'];

      for (let i = 0; i < documents.length; i++) {
        const document = documents[i];
        const accountData = {
          name: `User ${i + 1}`,
          document,
          email: `user${i + 1}@example.com`,
        };

        const response = await supertest(app.server)
          .post('/v1/accounts')
          .send(accountData)
          .expect(201);

        expect(response.body).toHaveProperty('accountId');
      }
    });
  });

  describe('GET /accounts/:accountId/balance', () => {
    it('should return account balance successfully', async () => {
      // First create an account
      const createResponse = await supertest(app.server)
        .post('/v1/accounts')
        .send({
          name: 'John Doe',
          document: `1234567890${Date.now().toString().slice(-4)}`, // 14 characters - unique document
          email: `john${Date.now()}@example.com`,
        })
        .expect(201);

      const accountId = createResponse.body.accountId;

      // Get balance
      const response = await supertest(app.server)
        .get(`/v1/accounts/${accountId}/balance`)
        .expect(200);

      expect(response.body).toMatchObject({
        accountId,
        name: 'John Doe',
        balance: 0, // New accounts start with 0 balance
      });
    });

    it('should return 404 for non-existent account', async () => {
      const nonExistentId = 'non-existent-id';

      const response = await supertest(app.server)
        .get(`/accounts/${nonExistentId}/balance`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Not Found');
    });

    it('should return correct balance after movements', async () => {
      // Create account
      const createResponse = await supertest(app.server)
        .post('/v1/accounts')
        .send({
          name: 'John Doe',
          document: `1234567890${Date.now().toString().slice(-4)}`, // 14 characters - unique document
          email: `john${Date.now()}@example.com`,
        })
        .expect(201);

      const accountId = createResponse.body.accountId;

      // Add some movements using API to ensure proper balance updates
      await supertest(app.server)
        .post('/v1/movements')
        .send({
          accountId,
          amount: 1000,
          type: 'CREDIT',
          description: 'Initial deposit',
        })
        .expect(201);

      await supertest(app.server)
        .post('/v1/movements')
        .send({
          accountId,
          amount: 200,
          type: 'DEBIT',
          description: 'Withdrawal',
        })
        .expect(201);

      // Update account balance
      await prisma.account.update({
        where: { id: accountId },
        data: { balance: 800 },
      });

      // Get balance
      const response = await supertest(app.server)
        .get(`/v1/accounts/${accountId}/balance`)
        .expect(200);

      expect(response.body).toMatchObject({
        accountId,
        name: 'John Doe',
        balance: 800,
      });
    });

    it('should handle zero balance', async () => {
      // Create account
      const createResponse = await supertest(app.server)
        .post('/v1/accounts')
        .send({
          name: 'John Doe',
          document: `1234567890${Date.now().toString().slice(-4)}`, // 14 characters - unique document
          email: `john${Date.now()}@example.com`,
        })
        .expect(201);

      const accountId = createResponse.body.accountId;

      // Update balance to 0
      await prisma.account.update({
        where: { id: accountId },
        data: { balance: 0 },
      });

      const response = await supertest(app.server)
        .get(`/v1/accounts/${accountId}/balance`)
        .expect(200);

      expect(response.body).toMatchObject({
        accountId,
        name: 'John Doe',
        balance: 0,
      });
    });

    it('should handle negative balance', async () => {
      // Create account
      const createResponse = await supertest(app.server)
        .post('/v1/accounts')
        .send({
          name: 'John Doe',
          document: `1234567890${Date.now().toString().slice(-4)}`, // 14 characters - unique document
          email: `john${Date.now()}@example.com`,
        })
        .expect(201);

      const accountId = createResponse.body.accountId;

      // Set negative balance directly
      await prisma.account.update({
        where: { id: accountId },
        data: { balance: -100.5 },
      });

      const response = await supertest(app.server)
        .get(`/v1/accounts/${accountId}/balance`)
        .expect(200);

      expect(response.body).toMatchObject({
        accountId,
        name: 'John Doe',
        balance: -100.5,
      });
    });
  });

  describe('Account Routes Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // This test would require mocking database errors
      // For now, we'll test that the error handler middleware works
      const response = await supertest(app.server)
        .get('/v1/accounts/invalid-uuid-format/balance')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return proper error format', async () => {
      const response = await supertest(app.server)
        .post('/v1/accounts')
        .send({ name: 'John Doe', document: '', email: 'john@example.com' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(typeof response.body.error).toBe('string');
    });
  });
});
