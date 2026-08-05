import { PrismaClient } from '@prisma/client';

import { env } from './env';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/**
 * A single Prisma client per process. Next.js hot-reloads modules in
 * development, which would otherwise exhaust the connection pool.
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: { db: { url: env.DATABASE_URL } },
    log: env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
