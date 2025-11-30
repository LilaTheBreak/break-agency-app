import { Request, Response, NextFunction } from "express";

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const roles = (req.user.roles || [])
    .map((r: any) => {
      if (typeof r === "string") return r.toLowerCase();
      if (r?.role?.name) return r.role.name.toLowerCase();
      return null;
    })
    .filter(Boolean);

  if (!roles.includes("admin")) {
    return res.status(403).json({ error: "Forbidden" });
  }

  next();
}
