#!/usr/bin/env node
import { ClientType } from '@gw2me/database';
import { createPrismaClient } from '@gw2me/database/setup';
import { randomBytes, scrypt } from 'node:crypto';
import { existsSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { loadEnvFile } from 'node:process';
import { styleText } from 'node:util';

async function run() {
  const demoDir = resolve('.');
  console.log(`Setting up demo ${styleText('gray', `(${demoDir})`)}`);

  // check if .env.local exists
  const envLocalExists = existsSync(join(demoDir, '.env.local'));
  if(envLocalExists) {
    console.log(styleText('green', 'Demo is already setup'));
    return;
  }

  console.log('Running first time setup');

  // load .env
  const databaseEnvFile = join(demoDir, '../../packages/database/.env');
  console.log(`Loading .env ${styleText('gray', `(${databaseEnvFile})`)}`);
  loadEnvFile(databaseEnvFile);

  const db = createPrismaClient({ connectionString: process.env.DATABASE_URL! });

  // get user
  const existingUser = await db.user.findFirst({ where: { roles: { has: 'Admin' }}});
  const user = existingUser ?? await db.user.create({ data: { name: 'demo' }});

  console.log(`User: ${user.name} (${user.id})`);

  // create application
  const { clientSecret, clientSecretHashed } = await createClientSecret();
  const application = await db.application.create({
    data: {
      name: 'gw2.me Demo',
      description: 'Demo application for gw2.me',
      ownerId: user.id,
      public: true,
      publicUrl: 'http://localhost:4001',
      clients: {
        create: {
          type: ClientType.Confidential,
          callbackUrls: ['http://localhost:4001/callback'],
          secrets: {
            create: {
              secret: clientSecretHashed
            }
          }
        }
      }
    },
    include: { clients: true }
  });

  console.log(`Application: ${application.name} (${application.id})`);

  // write clientId and secret to .env.local
  writeFileSync(join(demoDir, '.env.local'), `DEMO_CLIENT_ID="${application.clients[0].id}"\nDEMO_CLIENT_SECRET="${clientSecret}"\n`);
  console.log('.env.local created');

  console.log(styleText('green', 'Demo setup done'));
}

run();

// function readExistingEnvironmentVariables() {
//   const content = readFileSync(join(demoDir, '.env.local'));
// }

export async function createClientSecret() {
  const clientSecretBuffer = randomBytes(32);
  const salt = randomBytes(16);
  const hash = await new Promise<Buffer>((resolve, reject) => {
    scrypt(clientSecretBuffer, salt, 32, (error, key) => {
      if(error) {
        reject(error);
      }

      resolve(key);
    });
  });

  const saltHex = salt.toString('base64');
  const hashHex = hash.toString('base64');

  return {
    clientSecretHashed: `${saltHex}:${hashHex}`,
    clientSecret: clientSecretBuffer.toString('base64url')
  };
}
