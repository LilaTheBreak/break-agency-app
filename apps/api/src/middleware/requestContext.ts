import type { Request, Response, NextFunction } from "express";
import type { SessionUser } from '../lib/session';

declare global {
  namespace Express {
    interface Request {
      user?: SessionUser | null;
      ipAddress?: string;
    }
  }
}

export function requestContextMiddleware(req: Request, _res: Response, next: NextFunction) {
  if (!req.user?.id) {
    const userIdHeader = req.header("x-user-id");
    const roleHeader = req.header("x-user-role");

    if (userIdHeader) {
      req.user = {
        id: userIdHeader,
        email: req.user?.email || "",
        role: roleHeader || "CREATOR"
      };
    }
  }

  const forwarded = (req.headers["x-forwarded-for"] as string) || "";
  req.ipAddress = forwarded.split(",")[0] || req.socket.remoteAddress || "";

  next();
}
