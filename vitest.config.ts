import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/build/**/*.spec.ts'],
    environment: 'node',
  },
});
