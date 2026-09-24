import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./backend/src/__tests__/setup.ts'],
    env: {
      JWT_SECRET: 'test_secret_88b10ab1b1d3aecedc3f23214a59971ae50eb52f53a655adbee13a1839e78ba5',
      JWT_REFRESH_SECRET: 'test_refresh_secret_32chars_long!!',
      NODE_ENV: 'test',
      DB_NAME: 'cercaya_test'
    }
  },
});
