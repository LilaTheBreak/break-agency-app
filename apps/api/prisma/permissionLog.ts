import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type UserForLog = {
    id: string;
    role: string | null;
    subscription_status: string | null;
};

/**
 * Logs a permission denial event to the database.
 * This is useful for security auditing and identifying misconfigured permissions.
 * @param user The user who was denied access.
 * @param feature The feature they tried to access.
 * @param route The route they were on.
 */
export const logPermissionDenial = async (user: UserForLog, feature: string, route: string) => {
  try {
    // Using AuditLog as a generic place to store this. You could create a dedicated PermissionDenialLog model.
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'PERMISSION_DENIED',
        entityType: 'Feature',
        entityId: feature,
        metadata: {
          route,
          role: user.role,
          subscription: user.subscription_status,
        },
      },
    });
  } catch (error) {
    console.error('Failed to log permission denial:', error);
  }
};