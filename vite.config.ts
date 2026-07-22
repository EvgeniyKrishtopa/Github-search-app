import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-styled-components', { displayName: true }]],
      },
    }),
  ],
  resolve: {
    tsconfigPaths: true,
  },
  base: '/Github-search-app/',
  build: {
    outDir: 'dist',
  },
  css: {
    preprocessorOptions: {
      scss: {
        loadPaths: ['src'],
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    coverage: {
      thresholds: {
        statements: 90,
        lines: 90,
        functions: 90,
      },
    },
  },
});
