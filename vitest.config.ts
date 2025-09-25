import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Global configuration for all projects
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    env: {
      NODE_ENV: 'test',
    },
    // Performance optimizations
    bail: 1,
    logHeapUsage: false,
    inspectBrk: false,
    fileParallelism: true, // Enable file parallelism
    maxConcurrency: 5, // Limit concurrent tests
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'src/adapters/**/*.ts',
        'src/core/**/*.ts',
        '!src/core/contracts/**/*.ts',
      ],
      exclude: [
        'node_modules/',
        'tests/',
        'dist/',
        'coverage/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/migrations/',
      ],
    },
    testTimeout: 5000, // Reduced from 10s to 5s
    hookTimeout: 5000, // Reduced from 10s to 5s
    // Configure projects with proper inheritance
    projects: [
      {
        // Inherit global configuration
        extends: true,
        test: {
          name: {
            label: 'unit',
            color: 'blue',
          },
          include: ['tests/unit/**/*.test.ts'],
          // Unit tests can run in parallel
          pool: 'threads',
          poolOptions: {
            threads: {
              singleThread: false,
            },
          },
        },
      },
      {
        // Inherit global configuration
        extends: true,
        test: {
          name: {
            label: 'integration',
            color: 'green',
          },
          include: ['tests/integration/**/*.test.ts'],
          // Integration tests with controlled parallelism
          pool: 'threads',
          poolOptions: {
            threads: {
              singleThread: true,
            },
          },
          testTimeout: 10000, // Keep higher timeout for integration tests
          hookTimeout: 10000,
        },
      },
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
