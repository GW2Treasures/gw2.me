import { connection } from 'next/server';

export async function env(name: string, options?: { optional?: false }): Promise<string>;
export async function env(name: string, options: { optional: true }): Promise<string | undefined>;
export async function env(name: string, options: { optional?: boolean } = {}): Promise<string | undefined> {
  // env variables are only available at runtime
  if(!name.startsWith('NEXT_PUBLIC_')) {
    await connection();
  }

  const value = process.env[name];

  const optional = options.optional ?? false;

  if(!value && !optional) {
    throw new Error(`Environment variable ${name} not set`);
  }

  return value as string;
}
