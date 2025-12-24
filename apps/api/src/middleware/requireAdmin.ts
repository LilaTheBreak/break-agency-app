import { Request, Response, NextFunction } from "express";
import { isSuperAdmin, isAdmin } from "../lib/roleHelpers.js";

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  // CRITICAL: Superadmin bypasses ALL permission checks
  if (isSuperAdmin(req.user)) {
    return next();
  }

  // Check using centralized admin helper
  if (!isAdmin(req.user)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  next();
}
