import type { Request, Response, NextFunction } from "express";
import type { SessionUser } from "../lib/session.js";
import { isSuperAdmin, isAdmin as checkIsAdmin } from "../lib/roleHelpers.js";

declare global {
  namespace Express {
    interface Request {
      user?: SessionUser | null;
      isAdmin?: boolean;
    }
  }
}

/**
 * Admin-only authentication middleware
 * 
 * Ensures that only users with ADMIN, AGENCY_ADMIN, or SUPERADMIN role can access protected routes.
 * Must be used after requireAuth middleware.
 * 
 * CRITICAL: SUPERADMIN always bypasses this check
 * 
 * @example
 * router.use(requireAuth);
 * router.use(requireAdmin);
 * router.get("/admin-only", handler);
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ 
      error: "Authentication required",
      code: "AUTH_REQUIRED"
    });
  }

  // CRITICAL: Superadmin bypasses ALL permission checks
  if (isSuperAdmin(req.user)) {
    return next();
  }

  // Check if user is admin
  if (!checkIsAdmin(req.user)) {
    console.warn(`[ADMIN_AUTH] Access denied for user ${req.user.id} with role ${req.user.role}`);
    return res.status(403).json({ 
      error: "Admin access required",
      code: "ADMIN_REQUIRED",
      requiredRoles: ["ADMIN", "AGENCY_ADMIN", "SUPERADMIN"]
    });
  }

  next();
}

/**
 * Optional admin check - doesn't block request but adds isAdmin flag
 * Useful for endpoints that have different behavior for admins
 */
export function checkAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.user) {
    req.isAdmin = checkIsAdmin(req.user);
  } else {
    req.isAdmin = false;
  }
  next();
}
