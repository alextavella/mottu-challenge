// Load test environment variables FIRST
import { config } from 'dotenv';
config({ path: '.env.test' });

import { execSync } from 'child_process';
import { afterAll, beforeAll, beforeEach } from 'vitest';

// Setup test database
beforeAll(async () => {
  // // Ensure test environment is set
  // process.env.NODE_ENV = 'test';

  // // Set test database URL if not already set
  // if (!process.env.DATABASE_URL) {
  //   process.env.DATABASE_URL =
  //     'postgresql://postgres:postgres@localhost:5432/mini_ledger_test?schema=public';
  // }

  try {
    execSync('npx prisma db push --accept-data-loss', {
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
    });
  } catch (error) {
    console.warn(
      'Failed to setup test database (this is ok if DB is not running):',
      error,
    );
  }
});

// Clean database before each test
beforeEach(async () => {
  // Skip database cleanup for unit tests - they should be mocked
  // Integration tests will handle their own cleanup
});

// Cleanup after all tests
afterAll(async () => {
  // Cleanup handled by individual tests
});
