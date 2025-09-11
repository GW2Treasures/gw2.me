import { defineConfig } from 'prisma/config';
import { loadEnvFile } from 'node:process';
import { existsSync } from 'node:fs';

// load .env
if(existsSync('.env')) {
  loadEnvFile('.env');
}

export default defineConfig({
  schema: './prisma/schema.prisma',
});
