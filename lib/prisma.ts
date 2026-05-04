/**
 * PRISMA CLIENT SINGLETON
 *
 * Why singleton? Next.js in development mode uses "hot reloading" — it restarts
 * your code on every file save. Without this pattern, each reload would create
 * a NEW database connection, eventually exhausting the connection pool.
 *
 * This pattern stores the client on the global object so it survives reloads.
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query'] : [],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
