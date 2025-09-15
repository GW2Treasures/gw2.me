import { createPrismaClient } from '@gw2me/database/setup';

// https://pris.ly/d/help/next-js-best-practices

const prismaClientSingleton = () => {
  return createPrismaClient({ connectionString: process.env.DATABASE_URL! });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  db: PrismaClientSingleton | undefined,
};

export const db = globalForPrisma.db ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalForPrisma.db = db;
