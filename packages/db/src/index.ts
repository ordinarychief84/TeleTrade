import { PrismaClient } from '@prisma/client';

export * from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __teletradePrisma: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  global.__teletradePrisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'production'
        ? ['error']
        : ['warn', 'error'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.__teletradePrisma = prisma;
}
