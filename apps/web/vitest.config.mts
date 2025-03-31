import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
 
export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
    setupFiles: [
      './lib/oauth/to-be-oauth2-error.vitest.ts',
      './lib/db.mock.ts',
      './lib/next.mock.ts'
    ]
  },
});
