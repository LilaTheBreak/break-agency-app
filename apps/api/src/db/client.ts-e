/**
 * Centralized Prisma Database Client
 * 
 * This is the single source of truth for the Prisma client.
 * All application code should import from this file.
 * 
 * Location: src/db/client.ts (instead of src/lib/prisma.ts)
 * This ensures the client is properly compiled to dist/db/client.js
 * and all imports resolve correctly in production.
 */

import { PrismaClient } from "@prisma/client";

// Create a single Prisma instance to be shared across the application
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
