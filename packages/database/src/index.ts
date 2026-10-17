import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var globalPrisma: PrismaClient | undefined;
}

export const prisma =
  global.globalPrisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

// Always cache client on global across all environments (including production serverless lambdas)
// to avoid creating new connection pools on warm invocations.
global.globalPrisma = prisma;

export * from '@prisma/client';
