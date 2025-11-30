import type { Request, Response, NextFunction } from "express";
import { UserRoleType } from "@prisma/client";

export function requireRole(roles: UserRoleType[]) {
  return function roleGuard(req: Request, res: Response, next: NextFunction) {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const userRole = req.user.role;

    // Super Admins bypass role checks
    if (userRole === 'SUPER_ADMIN') {
      return next();
    }

    if (!userRole || !roles.includes(userRole)) {
      return res.status(403).json({ error: "Insufficient role permissions" });
    }
    next();
  };
}
