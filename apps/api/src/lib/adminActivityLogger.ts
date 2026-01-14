import { Prisma } from "@prisma/client";
import type { Request } from "express";
import prisma from './prisma.js';
import { logError } from './logger.js';

type AdminActivityPayload = {
  event?: string;
  action?: string; // Alternative name for event
  entityType?: string; // Type of entity being modified
  entityId?: string; // ID of the entity being modified
  metadata?: Record<string, unknown> | null;
};

export async function logAdminActivity(req: Request, payload: AdminActivityPayload) {
  try {
    // Note: adminActivity model doesn't exist - using AuditLog instead
    await prisma.auditLog.create({
      data: {
        userId: req.user?.id ?? null,
        userEmail: req.user?.email ?? null,
        userRole: req.user?.role ?? null,
        action: payload.action || payload.event,
        entityType: payload.entityType || "AdminActivity",
        entityId: payload.entityId,
        metadata: (payload.metadata ?? undefined) as Prisma.InputJsonValue,
        ipAddress: req.ipAddress ?? req.ip ?? null
      }
    });
  } catch (error) {
    logError("Failed to log admin activity", error, { event: payload.event });
  }
}
