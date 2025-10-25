import { defineConfig, env } from 'prisma/config';
import { loadEnvFile } from 'node:process';
import { existsSync } from 'node:fs';
import { styleText } from 'node:util';

// load .env
if(existsSync('.env')) {
  console.log(styleText('dim', '[@gw2me/database] load .env'));
  loadEnvFile('.env');
}

export default defineConfig({
  schema: './prisma/schema.prisma',
  engine: 'classic',
  datasource: {
    url: env('DATABASE_URL'),
  },
});
