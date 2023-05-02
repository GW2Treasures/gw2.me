import { randomBytes } from 'crypto';

export function generateRefreshToken(): string {
  return randomBytes(32).toString('base64url');
}

export function generateAccessToken(): string {
  return randomBytes(16).toString('base64url');
}

export function generateCode(): string {
  return randomBytes(16).toString('base64url');
}
