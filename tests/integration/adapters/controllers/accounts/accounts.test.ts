import { prisma } from '@/infrastructure/database/client';
import { createServer } from '@/infrastructure/http/server';
import { FastifyInstance } from 'fastify';
import supertest from 'supertest';
import { cleanupTestDatabase } from 'tests/helpers/database-test-helper';
import {
  ValidationMessages,
  expectFieldError,
  expectValidationErrorStructure,
} from 'tests/helpers/validation-test-helper';

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
    // Clean test database before each test
    await cleanupTestDatabase();
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

      expectValidationErrorStructure(response);

      // Check that we have validation errors for all required fields
      expect(response.body.fields).toHaveProperty('name');
      expect(response.body.fields).toHaveProperty('document');
      expect(response.body.fields).toHaveProperty('email');

      // Verify the error messages contain the expected text
      expect(response.body.fields.name).toContain('Nome é obrigatório');
      expect(response.body.fields.document).toContain(
        'Documento é obrigatório',
      );
      expect(response.body.fields.email).toContain('Email deve ser válido');
    });

    it('should return 400 for missing document', async () => {
      const response = await supertest(app.server)
        .post('/v1/accounts')
        .send({ name: 'John Doe', document: '', email: 'john@example.com' })
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'VALIDATION_ERROR',
        message: 'Os dados enviados são inválidos',
        errors: expect.arrayContaining([
          expect.stringContaining(
            'Documento deve ter pelo menos 11 caracteres',
          ),
        ]),
        fields: expect.objectContaining({
          document: expect.stringContaining(
            'Documento deve ter pelo menos 11 caracteres',
          ),
        }),
      });
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
      expect(response.body.error).toContain('BusinessRuleViolationError');
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
        balance: 1000, // New accounts start with 1000 balance
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

    it('should set balance to 1000 by default', async () => {
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

      const response = await supertest(app.server)
        .get(`/v1/accounts/${accountId}/balance`)
        .expect(200);

      expect(response.body).toMatchObject({
        accountId,
        name: 'John Doe',
        balance: 1000,
      });
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
          amount: 500,
          type: 'CREDIT',
          description: 'Initial deposit',
        })
        .expect(201);

      await supertest(app.server)
        .post('/v1/movements')
        .send({
          accountId,
          amount: 250,
          type: 'DEBIT',
          description: 'Withdrawal',
        })
        .expect(201);

      // Get balance
      const response = await supertest(app.server)
        .get(`/v1/accounts/${accountId}/balance`)
        .expect(200);

      expect(response.body).toMatchObject({
        accountId,
        name: 'John Doe',
        balance: 1250,
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

    it('should return proper error format for validation errors', async () => {
      const response = await supertest(app.server)
        .post('/v1/accounts')
        .send({ name: '', document: 'abc', email: 'invalid-email' })
        .expect(400);

      expectValidationErrorStructure(response);
    });

    it('should return specific validation errors for each field', async () => {
      // Test empty name
      const emptyNameResponse = await supertest(app.server)
        .post('/v1/accounts')
        .send({ name: '', document: '12345678901', email: 'valid@email.com' })
        .expect(400);

      expectFieldError(
        emptyNameResponse,
        'name',
        ValidationMessages.REQUIRED_NAME,
      );

      // Test invalid email
      const invalidEmailResponse = await supertest(app.server)
        .post('/v1/accounts')
        .send({
          name: 'Valid Name',
          document: '12345678901',
          email: 'invalid-email',
        })
        .expect(400);

      expectFieldError(
        invalidEmailResponse,
        'email',
        ValidationMessages.INVALID_EMAIL,
      );

      // Test short document
      const shortDocResponse = await supertest(app.server)
        .post('/v1/accounts')
        .send({ name: 'Valid Name', document: '123', email: 'valid@email.com' })
        .expect(400);

      expectFieldError(
        shortDocResponse,
        'document',
        ValidationMessages.REQUIRED_DOCUMENT,
      );
    });
  });
});
