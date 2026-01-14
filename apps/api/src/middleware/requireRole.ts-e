import type { Request, Response, NextFunction } from "express";
import { UserRoleType } from '../types/custom';
import { isSuperAdmin, hasRole } from '../lib/roleHelpers';

export function requireRole(roles: UserRoleType[]) {
  return function roleGuard(req: Request, res: Response, next: NextFunction) {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // CRITICAL: Superadmin bypasses ALL role checks
    if (isSuperAdmin(req.user)) {
      return next();
    }

    // Check if user has one of the allowed roles
    if (!hasRole(req.user, roles)) {
      return res.status(403).json({ error: "Insufficient role permissions" });
    }
    next();
  };
}
