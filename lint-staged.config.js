/**
 * @type {import('lint-staged').Configuration}
 */
export default {
  // Lint and format all TypeScript files
  '*.{ts,tsx}': ['eslint --fix', 'prettier --write'],

  // Format JSON, Markdown, and YAML files
  '*.{json,md,yml,yaml}': ['prettier --write'],

  // Run tests when source files or test files change
  'src/**/*.{ts,tsx}': () => 'pnpm test:run',
  'tests/**/*.test.{ts,tsx}': () => 'pnpm test:run',

  // Run tests when configuration files change
  '{vitest.config.ts,tsconfig.json,.env*}': () => 'pnpm test:run',
};
