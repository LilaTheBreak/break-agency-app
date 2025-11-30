import { Prisma } from "@prisma/client";
import type { Request } from "express";
import prisma from "./prisma.js";

type AuditPayload = {
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
};

export async function logAuditEvent(req: Request, payload: AuditPayload) {
  await prisma.auditLog.create({
    data: {
      userId: req.user?.id ?? null,
      action: payload.action,
      entityType: payload.entityType ?? null,
      entityId: payload.entityId ?? null,
      metadata: (payload.metadata ?? undefined) as Prisma.InputJsonValue
    }
  });
}

export function isAdminRequest(req: Request) {
  const roles = req.user?.roles || [];
  return roles.some((role) => String(role).toLowerCase() === "admin");
}
