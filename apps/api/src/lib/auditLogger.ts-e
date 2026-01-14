import { Prisma } from "@prisma/client";
import type { Request } from "express";
import prisma from './prisma';
import { isSuperAdmin, isAdmin } from './roleHelpers';

type AuditPayload = {
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
};

/**
 * Log audit events for security-sensitive operations
 * Captures user info, IP, user agent, and custom metadata
 */
export async function logAuditEvent(req: Request, payload: AuditPayload) {
  try {
    const user = req.user;
    const ipAddress = req.ip || req.socket?.remoteAddress || null;
    const userAgent = req.headers['user-agent'] || null;

    await prisma.auditLog.create({
      data: {
        userId: user?.id ?? null,
        userEmail: user?.email ?? null,
        userRole: user?.role ?? null,
        action: payload.action,
        entityType: payload.entityType ?? null,
        entityId: payload.entityId ?? null,
        ipAddress: ipAddress?.substring(0, 50) ?? null, // Limit length
        userAgent: userAgent?.substring(0, 255) ?? null, // Limit length
        metadata: (payload.metadata ?? undefined) as Prisma.InputJsonValue
      }
    });
  } catch (error) {
    // Log error but don't throw - audit logging shouldn't break requests
    console.error('[AUDIT] Failed to log event:', error);
  }
}

/**
 * Log SUPERADMIN-specific actions (elevated privilege operations)
 */
export async function logSuperAdminAction(req: Request, payload: AuditPayload) {
  if (!isSuperAdmin(req.user)) {
    return; // Only log if actually SUPERADMIN
  }

  await logAuditEvent(req, {
    ...payload,
    action: `SUPERADMIN_${payload.action}`,
    metadata: {
      ...payload.metadata,
      isSuperAdmin: true,
      timestamp: new Date().toISOString()
    }
  });
}

/**
 * Log destructive operations (deletions, permanent changes)
 */
export async function logDestructiveAction(req: Request, payload: AuditPayload) {
  await logAuditEvent(req, {
    ...payload,
    action: `DESTRUCTIVE_${payload.action}`,
    metadata: {
      ...payload.metadata,
      warningLevel: 'HIGH',
      timestamp: new Date().toISOString()
    }
  });
}

/**
 * Log authentication events (login, logout, role changes)
 */
export async function logAuthEvent(req: Request, payload: AuditPayload) {
  await logAuditEvent(req, {
    ...payload,
    action: `AUTH_${payload.action}`,
    metadata: {
      ...payload.metadata,
      timestamp: new Date().toISOString()
    }
  });
}

/**
 * Check if request is from admin user
 */
export function isAdminRequest(req: Request) {
  return isAdmin(req.user) || isSuperAdmin(req.user);
}
