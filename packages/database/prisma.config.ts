import { defineConfig, env } from 'prisma/config';
import { loadEnvFile } from 'node:process';
import { existsSync } from 'node:fs';
import { styleText } from 'node:util';
import { join } from 'node:path';

// load .env
const envFilePath = join(import.meta.dirname, '.env');
if(existsSync(envFilePath)) {
  console.log(styleText('dim', '[@gw2me/database] load .env'));
  loadEnvFile(envFilePath);
}

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasource: {
    url: env('DATABASE_URL'),
  },
});
