import type { Request, Response, NextFunction } from "express";

export function requireRole(roles: string[]) {
  const normalized = roles.map((role) => role.toLowerCase());
  return function roleGuard(req: Request, res: Response, next: NextFunction) {
    const userRoles = req.user?.roles || [];
    const hasRole = userRoles.some((role) => normalized.includes(role.toLowerCase()));
    if (!hasRole) {
      return res.status(403).json({ error: "Insufficient role permissions" });
    }
    next();
  };
}
