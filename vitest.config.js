import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals:     false,
    include:     ['tests/domain/**/*.test.*', 'tests/ai/**/*.test.*', 'tests/integration/**/*.test.*'],
    exclude:     ['tests/e2e/**', '**/__snapshots__/**'],
  },
});
