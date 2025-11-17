import type { Request } from "express";
import prisma from "./prisma.js";
import { logError } from "./logger.js";

type AdminActivityPayload = {
  event: string;
  metadata?: Record<string, unknown> | null;
};

export async function logAdminActivity(req: Request, payload: AdminActivityPayload) {
  try {
    await prisma.adminActivity.create({
      data: {
        actorId: req.user?.id ?? null,
        event: payload.event,
        metadata: payload.metadata ?? null,
        ip: req.ipAddress ?? req.ip
      }
    });
  } catch (error) {
    logError("Failed to log admin activity", error, { event: payload.event });
  }
}
