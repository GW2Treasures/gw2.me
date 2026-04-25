import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
 
export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: 'node',
    setupFiles: [
      './lib/oauth/to-be-oauth2-error.vitest.ts',
      './lib/db.mock.ts',
      './lib/next.mock.ts'
    ]
  },
});
