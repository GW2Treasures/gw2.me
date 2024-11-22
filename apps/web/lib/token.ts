import { randomBytes, scrypt } from 'crypto';

export function generateRefreshToken(): string {
  return randomBytes(32).toString('base64url');
}

export function generateAccessToken(): string {
  return randomBytes(16).toString('base64url');
}

export function generateCode(): string {
  return randomBytes(16).toString('base64url');
}

export async function generateClientSecretAndHash() {
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
    raw: clientSecretBuffer.toString('base64url'),
    hashed: `${saltHex}:${hashHex}`
  };
}
