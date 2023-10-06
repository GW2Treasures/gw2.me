import { createHash, randomBytes } from 'crypto';
import 'server-only';

export const client_id = 'example_client_id';
export const client_secret = Buffer.from('example_client_secret', 'utf-8').toString('base64url');
export const code_verifier = randomBytes(32).toString('base64url');
export const code_challenge = createHash('sha256').update(code_verifier).digest('base64url');
