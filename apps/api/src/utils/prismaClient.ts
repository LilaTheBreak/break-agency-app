/**
 * DEPRECATED: Use ../db/client.ts instead
 * 
 * This file is maintained for backward compatibility.
 * Re-exports the Prisma client from the centralized location.
 */

import prismaInstance from '../db/client';

export const prisma = prismaInstance;
