// Load test environment variables FIRST
import { config } from 'dotenv';
config({ path: '.env.test' });

import { execSync } from 'child_process';
import { afterAll, beforeAll, beforeEach } from 'vitest';

// Setup test database
beforeAll(async () => {
  // Ensure test environment is set
  process.env.NODE_ENV = 'test';

  console.log('Setting up test database:', process.env.DATABASE_URL);

  try {
    execSync('npx prisma db push --accept-data-loss', {
      stdio: 'inherit',
      env: { ...process.env },
    });
    console.log('Test database setup completed');
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
