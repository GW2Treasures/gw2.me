#!/usr/bin/env node
import { writeFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import { randomUUID, randomBytes, scrypt } from 'crypto';
import { PrismaClient } from '@gw2me/database';

async function run() {
  const demoDir = resolve('.');
  console.log(`Setting up demo (${demoDir})`);

  // check if .env.local exists
  const envLocalExists = existsSync(join(demoDir, '.env.local'));

  if(envLocalExists) {
    console.log('demo is already setup');
    return;
  }

  console.log('Running first time setup');

  const db = new PrismaClient({});

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
      type: 'Confidential',
      clientId: randomUUID(),
      clientSecret: clientSecretHashed,
      ownerId: user.id,
      public: true,
      publicUrl: 'http://localhost:4001',
      callbackUrls: ['http://localhost:4001/callback']
    }
  });

  console.log(`Application: ${application.name} (${application.id})`);

  // write clientId and secret to .env.local
  writeFileSync(join(demoDir, '.env.local'), `DEMO_CLIENT_ID="${application.clientId}"\nDEMO_CLIENT_SECRET="${clientSecret}"\n`);
  console.log('.env.local created');
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
