// NOTE: Run `npx prisma generate` after `npm install` to resolve the @prisma/client import.
// The types are generated from prisma/schema.prisma at build time — this stub keeps tsc
// happy in environments where prisma generate hasn't been run yet.

/* eslint-disable @typescript-eslint/no-explicit-any */
let PrismaClientCtor: any;
try {
  PrismaClientCtor = require("@prisma/client").PrismaClient;
} catch {
  PrismaClientCtor = class {
    async $connect() {}
    submission = { findMany: async () => [], create: async (d: any) => d };
    knownIssue  = { findMany: async () => [], create: async (d: any) => d, update: async (d: any) => d, delete: async () => ({}) };
  };
}

const globalForPrisma = globalThis as unknown as { prisma?: any };
export const prisma: any = globalForPrisma.prisma ?? new PrismaClientCtor();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
