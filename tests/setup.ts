// Load test environment variables FIRST
import { config } from 'dotenv';
config({ path: '.env.test' });

import { execSync } from 'child_process';

// Handle unhandled rejections from RabbitMQ during test teardown
process.on('unhandledRejection', (reason, promise) => {
  // Only log if it's not a RabbitMQ channel error (expected during teardown)
  if (reason instanceof Error && reason.message.includes('Channel ended')) {
    // This is expected during test teardown, so we can ignore it
    return;
  }
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Global database setup flag
let isDatabaseSetup = false;

// Setup test database (only once)
beforeAll(async () => {
  // Ensure test environment is set
  process.env.NODE_ENV = 'test';

  if (!isDatabaseSetup) {
    try {
      execSync('npx prisma db push --accept-data-loss', {
        stdio: 'inherit',
        env: { ...process.env },
      });
      isDatabaseSetup = true;
    } catch (error) {
      console.warn(
        'Failed to setup test database (this is ok if DB is not running):',
        error,
      );
    }
  }
});

// Clean database before each test (optimized)
beforeEach(async () => {
  // Skip database cleanup for unit tests - they should be mocked
  // Integration tests will handle their own cleanup
});

// Cleanup after all tests
afterAll(async () => {
  // Cleanup handled by individual tests
});
