import type { Request, Response, NextFunction } from "express";

/**
 * Admin-only authentication middleware
 * 
 * Ensures that only users with ADMIN or AGENCY_ADMIN role can access protected routes.
 * Must be used after requireAuth middleware.
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

  const adminRoles = ["ADMIN", "AGENCY_ADMIN", "SUPER_ADMIN"];
  const userRole = req.user.role?.toUpperCase();

  if (!userRole || !adminRoles.includes(userRole)) {
    console.warn(`[ADMIN_AUTH] Access denied for user ${req.user.id} with role ${userRole}`);
    return res.status(403).json({ 
      error: "Admin access required",
      code: "ADMIN_REQUIRED",
      requiredRoles: adminRoles
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
    const adminRoles = ["ADMIN", "AGENCY_ADMIN", "SUPER_ADMIN"];
    const userRole = req.user.role?.toUpperCase();
    req.isAdmin = userRole && adminRoles.includes(userRole);
  } else {
    req.isAdmin = false;
  }
  next();
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      isAdmin?: boolean;
    }
  }
}
