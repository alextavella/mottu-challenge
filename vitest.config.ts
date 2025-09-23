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
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
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
    testTimeout: 10000,
    hookTimeout: 10000,
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
          // Run integration tests sequentially to avoid database conflicts
          pool: 'threads',
          poolOptions: {
            threads: {
              singleThread: true,
            },
          },
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
