/* eslint-disable @typescript-eslint/no-explicit-any */
const globalForPrisma = globalThis as unknown as { prisma?: any };

let _prisma: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaClient } = require("@prisma/client");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaPg } = require("@prisma/adapter-pg");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Pool } = require("pg");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  _prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });
} catch {
  const noop = async (d?: any) => d ?? {};
  const noopArr = async () => [];
  const noopNull = async () => null;
  _prisma = {
    board:      { findFirst: noopNull, create: noop },
    column:     { findMany: noopArr, findFirst: noopNull, create: noop, update: noop, delete: noop },
    card:       { findMany: noopArr, findUnique: noopNull, findFirst: noopNull, create: noop, update: noop, delete: noop },
    comment:    { findMany: noopArr, create: noop },
    submission: { findMany: noopArr, create: noop },
    knownIssue: { findMany: noopArr, create: noop, update: noop, delete: noop },
  };
}

export const prisma: any = _prisma;
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = _prisma;
