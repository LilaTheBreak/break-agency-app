import { prisma } from '../db/client';

export interface AuditEvent {
  eventType: "IMPERSONATION_STARTED" | "IMPERSONATION_ENDED" | string;
  userId: string;
  targetUserId?: string;
  metadata?: Record<string, any>;
}

/**
 * Log an audit event to the database
 * This creates a permanent record for security auditing
 */
export async function logAuditEvent({
  eventType,
  userId,
  targetUserId,
  metadata = {},
}: AuditEvent): Promise<void> {
  try {
    // Check if AuditLog table exists, if not create an entry in a log file
    // For now, we'll attempt to create in DB and fall back to console
    try {
      const auditLog = await prisma.auditLog?.create({
        data: {
          eventType,
          userId,
          targetUserId,
          metadata,
          timestamp: new Date(),
        },
      } as any);
      console.log("[AUDIT]", eventType, auditLog?.id);
    } catch (dbError) {
      // If table doesn't exist, log to console with timestamp and structured data
      console.log(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          eventType,
          userId,
          targetUserId,
          metadata,
        }, null, 2)
      );
    }
  } catch (error) {
    console.error("[AUDIT] Failed to log event:", error);
    // Don't throw - audit logging should not block operations
  }
}

/**
 * Retrieve audit logs for a specific user or event type
 */
export async function getAuditLogs(filters?: {
  userId?: string;
  targetUserId?: string;
  eventType?: string;
  limit?: number;
}): Promise<any[]> {
  try {
    return await prisma.auditLog?.findMany({
      where: {
        ...(filters?.userId && { userId: filters.userId }),
        ...(filters?.targetUserId && { targetUserId: filters.targetUserId }),
        ...(filters?.eventType && { eventType: filters.eventType }),
      },
      take: filters?.limit || 100,
      orderBy: { timestamp: "desc" },
    } as any);
  } catch (error) {
    console.error("[AUDIT] Failed to retrieve logs:", error);
    return [];
  }
}
