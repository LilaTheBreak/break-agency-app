import { Prisma } from "@prisma/client";
import type { Request, Response, NextFunction } from "express";
import { logAuditEvent } from '../lib/auditLogger.js';

const ROUTE_ACTIONS = [
  { match: /\/auth\/login/i, action: "auth.login", entityType: "auth" },
  { match: /\/profiles/i, action: "profile.update", entityType: "user" },
  { match: /brief/i, action: "brief.update", entityType: "brief" },
  { match: /approvals/i, action: "approvals.update", entityType: "approval" },
  { match: /finance|payout|payment/i, action: "finance.update", entityType: "finance" },
  { match: /social/i, action: "social.update", entityType: "social" }
];

export function auditMiddleware(req: Request, res: Response, next: NextFunction) {
  // TEMPORARILY DISABLED - AuditLog model not in schema
  return next();
  
  /* const path = req.path;
  const entry = ROUTE_ACTIONS.find((pattern) => pattern.match.test(path));
  if (!entry) return next();

  res.on("finish", () => {
    if (res.statusCode >= 200 && res.statusCode < 400) {
      const entityCandidate =
        req.params?.userId || req.params?.email || req.params?.id || req.query?.userId || undefined;
      void logAuditEvent(req, {
        action: entry.action,
        entityType: entry.entityType,
        entityId: typeof entityCandidate === "string" ? entityCandidate : undefined,
        metadata: { method: req.method, path } as Prisma.JsonObject
      });
    }
  }); */

  next();
}
