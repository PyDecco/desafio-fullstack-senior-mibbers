import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Resolve o alias "@/*" do tsconfig nativamente (Vitest 4).
    tsconfigPaths: true,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    css: false,
    include: ['**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['components/**', 'features/**', 'hooks/**', 'lib/**', 'services/**'],
      exclude: ['**/*.test.{ts,tsx}'],
      reporter: ['text', 'text-summary'],
    },
  },
});
