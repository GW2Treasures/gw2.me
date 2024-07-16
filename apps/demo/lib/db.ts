import { PrismaClient } from '@gw2me/database';

// https://pris.ly/d/help/next-js-best-practices

const globalForPrisma = global as unknown as {
  _db: PrismaClient | undefined
};

export const db =
  globalForPrisma._db ??
  new PrismaClient({
    log: ['query'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma._db = db;
