import { beforeAll, afterAll, beforeEach } from 'vitest';
import { execSync } from 'node:child_process';

// Setup test database
beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = 'file:./test.db';
  
  // Skip migrations for unit tests - they should be mocked
  // Integration tests will handle their own database setup
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
