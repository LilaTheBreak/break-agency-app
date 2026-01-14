/**
 * DEPRECATED: Use src/db/client.ts instead
 * 
 * This file is maintained for backward compatibility during migration.
 * All new imports should use: import prisma from '../db/client'
 * 
 * This re-exports the singleton Prisma instance from the centralized location.
 */

import prisma from '../db/client';

export default prisma;
