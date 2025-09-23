import { prisma } from '@/infrastructure/database/client';
import { createServer } from '@/infrastructure/http/server';
import { Prisma } from '@prisma/client';
import { FastifyInstance } from 'fastify';
import supertest from 'supertest';
import {
  ValidationMessages,
  expectFieldError,
  expectValidationErrorStructure,
} from '../../../../helpers/validation-test-helper';

describe('Movement Routes', () => {
  let app: FastifyInstance;
  let testAccountId: string;

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

    // Create a test account
    const account = await prisma.account.create({
      data: {
        name: 'Test Account',
        email: `test${Date.now()}@test.com`,
        document: `1234567890${Date.now().toString().slice(-4)}`, // 14 characters - unique document
        balance: new Prisma.Decimal(1000),
      },
    });
    testAccountId = account.id;
  });

  describe('POST /movements', () => {
    it('should create a credit movement successfully', async () => {
      const movementData = {
        accountId: testAccountId,
        amount: 500,
        type: 'CREDIT',
        description: 'Salary deposit',
      };

      const response = await supertest(app.server)
        .post('/v1/movements')
        .send(movementData)
        .expect(201);

      expect(response.body).toMatchObject({
        movementId: expect.any(String),
      });

      // Verify movement was created in database
      const createdMovement = await prisma.movement.findUnique({
        where: { id: response.body.movementId },
      });

      expect(createdMovement).toBeTruthy();
      expect(createdMovement?.amount.toNumber()).toBe(500);

      // Verify account balance was updated
      const updatedAccount = await prisma.account.findUnique({
        where: { id: testAccountId },
      });

      expect(updatedAccount?.balance.toNumber()).toBe(1500); // 1000 + 500
    });

    it('should create a debit movement successfully', async () => {
      const movementData = {
        accountId: testAccountId,
        amount: 300,
        type: 'DEBIT',
        description: 'ATM withdrawal',
      };

      const response = await supertest(app.server)
        .post('/v1/movements')
        .send(movementData)
        .expect(201);

      expect(response.body).toMatchObject({
        movementId: expect.any(String),
      });

      // Verify account balance was updated
      const updatedAccount = await prisma.account.findUnique({
        where: { id: testAccountId },
      });

      expect(updatedAccount?.balance.toNumber()).toBe(700); // 1000 - 300
    });

    it('should return 400 for invalid request body', async () => {
      const response = await supertest(app.server)
        .post('/v1/movements')
        .send({})
        .expect(400);

      expectValidationErrorStructure(response);

      // Check that we have validation errors for all required fields
      expect(response.body.fields).toHaveProperty('accountId');
      expect(response.body.fields).toHaveProperty('amount');
      expect(response.body.fields).toHaveProperty('type');

      // Verify the error messages contain the expected text
      expect(response.body.fields.accountId).toContain(
        'AccountId deve ser um UUID válido',
      ); // undefined treated as invalid UUID
      expect(response.body.fields.amount).toContain('Valor é obrigatório');
      expect(response.body.fields.type).toContain(
        'Tipo de movimento é obrigatório',
      );
    });

    it('should return 400 for missing required fields', async () => {
      const incompleteData = {
        accountId: testAccountId,
        amount: 100,
        // missing type field
      };

      const response = await supertest(app.server)
        .post('/v1/movements')
        .send(incompleteData)
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'VALIDATION_ERROR',
        message: 'Os dados enviados são inválidos',
        errors: expect.any(Array),
        fields: expect.any(Object),
      });

      // Should have validation error for missing type field
      expect(response.body.fields).toHaveProperty('type');
    });

    it('should return 400 for non-existent account', async () => {
      const movementData = {
        accountId: '550e8400-e29b-41d4-a716-446655440000', // Valid UUID but non-existent
        amount: 100,
        type: 'CREDIT',
        description: 'Test movement',
      };

      const response = await supertest(app.server)
        .post('/v1/movements')
        .send(movementData)
        .expect(400); // BusinessError returns 400, not 404

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('AccountNotFoundError');
    });

    it('should return 400 for insufficient balance on debit', async () => {
      const movementData = {
        accountId: testAccountId,
        amount: 2000, // More than the 1000 balance
        type: 'DEBIT',
        description: 'Large withdrawal',
      };

      const response = await supertest(app.server)
        .post('/v1/movements')
        .send(movementData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('InsufficientFundsError');
    });

    it('should reject zero amount movement', async () => {
      const movementData = {
        accountId: testAccountId,
        amount: 0,
        type: 'CREDIT',
        description: 'Zero amount test',
      };

      const response = await supertest(app.server)
        .post('/v1/movements')
        .send(movementData)
        .expect(400); // Validation should reject zero amounts

      expect(response.body).toMatchObject({
        error: 'VALIDATION_ERROR',
        message: 'Os dados enviados são inválidos',
        errors: expect.arrayContaining([
          expect.stringContaining('Valor deve ser positivo'),
        ]),
        fields: expect.objectContaining({
          amount: expect.stringContaining('Valor deve ser positivo'),
        }),
      });
    });

    it('should handle decimal amounts correctly', async () => {
      const movementData = {
        accountId: testAccountId,
        amount: 123.45,
        type: 'CREDIT',
        description: 'Decimal amount test',
      };

      const response = await supertest(app.server)
        .post('/v1/movements')
        .send(movementData)
        .expect(201);

      expect(response.body).toMatchObject({
        movementId: expect.any(String),
      });

      // Verify precision in database
      const createdMovement = await prisma.movement.findUnique({
        where: { id: response.body.movementId },
      });

      expect(createdMovement?.amount.toNumber()).toBe(123.45);
    });

    it('should handle negative amounts by rejecting them', async () => {
      const movementData = {
        accountId: testAccountId,
        amount: -100,
        type: 'CREDIT',
        description: 'Negative amount test',
      };

      const response = await supertest(app.server)
        .post('/v1/movements')
        .send(movementData)
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'VALIDATION_ERROR',
        message: 'Os dados enviados são inválidos',
        errors: expect.arrayContaining([
          expect.stringContaining('Valor deve ser positivo'),
        ]),
        fields: expect.objectContaining({
          amount: expect.stringContaining('Valor deve ser positivo'),
        }),
      });
    });

    it('should validate movement type enum', async () => {
      const movementData = {
        accountId: testAccountId,
        amount: 100,
        type: 'INVALID_TYPE',
        description: 'Invalid type test',
      };

      const response = await supertest(app.server)
        .post('/v1/movements')
        .send(movementData)
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'VALIDATION_ERROR',
        message: 'Os dados enviados são inválidos',
        errors: expect.any(Array),
        fields: expect.objectContaining({
          type: expect.any(String),
        }),
      });
    });
  });

  describe('Movement Routes Performance', () => {
    it('should handle sequential movements correctly', async () => {
      // Test sequential movements to avoid connection issues
      const response1 = await supertest(app.server).post('/v1/movements').send({
        accountId: testAccountId,
        amount: 100,
        type: 'CREDIT',
        description: 'Sequential movement 1',
      });

      expect(response1.status).toBe(201);

      const response2 = await supertest(app.server).post('/v1/movements').send({
        accountId: testAccountId,
        amount: 50,
        type: 'DEBIT',
        description: 'Sequential movement 2',
      });

      expect(response2.status).toBe(201);

      // Verify final balance: 1000 + 100 - 50 = 1050
      const finalAccount = await prisma.account.findUnique({
        where: { id: testAccountId },
      });

      expect(finalAccount?.balance.toNumber()).toBe(1050);
    });

    it('should respond within reasonable time', async () => {
      const startTime = Date.now();

      const response = await supertest(app.server).post('/v1/movements').send({
        accountId: testAccountId,
        amount: 25,
        type: 'CREDIT',
        description: 'Performance test movement',
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(201);
      expect(responseTime).toBeLessThan(5000); // Should respond within 5 seconds
    });
  });

  describe('Movement Routes Error Handling', () => {
    it('should return proper error format for validation errors', async () => {
      const response = await supertest(app.server)
        .post('/v1/movements')
        .send({ accountId: 'invalid-uuid', amount: -50, type: 'INVALID' })
        .expect(400);

      expectValidationErrorStructure(response);
    });

    it('should return specific validation errors for invalid UUID', async () => {
      const response = await supertest(app.server)
        .post('/v1/movements')
        .send({ accountId: 'not-a-uuid', amount: 100, type: 'CREDIT' })
        .expect(400);

      expectFieldError(response, 'accountId', ValidationMessages.INVALID_UUID);
    });

    it('should return specific validation errors for invalid amount', async () => {
      const response = await supertest(app.server)
        .post('/v1/movements')
        .send({ accountId: testAccountId, amount: 0, type: 'CREDIT' })
        .expect(400);

      expectFieldError(response, 'amount', ValidationMessages.POSITIVE_AMOUNT);
    });
  });
});
