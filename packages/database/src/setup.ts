import { PrismaPg } from '@prisma/adapter-pg';
import { type Prisma, PrismaClient } from './generated/prisma/client.js';
import type { LogOptions } from './generated/prisma/internal/class.js';

export function createPrismaClient<
    Options extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
    LogOpts extends LogOptions<Options> = LogOptions<Options>,
    OmitOpts extends Prisma.PrismaClientOptions['omit'] = Options extends { omit: infer U } ? U : Prisma.PrismaClientOptions['omit'],
>({ connectionString, ...options }: { connectionString: string } & Options) {
  const adapter = new PrismaPg({ connectionString });
  const client = new PrismaClient({ ...options, adapter });

  return client as unknown as PrismaClient<LogOpts, OmitOpts> ;
}
