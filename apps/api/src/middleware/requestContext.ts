import type { Request, Response, NextFunction } from "express";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        roles: string[];
      };
      ipAddress?: string;
    }
  }
}

export function requestContextMiddleware(req: Request, _res: Response, next: NextFunction) {
  const userIdHeader = req.header("x-user-id");
  const rolesHeader = req.header("x-user-roles");

  if (userIdHeader) {
    req.user = {
      id: userIdHeader,
      roles: rolesHeader ? rolesHeader.split(",").map((role) => role.trim()) : []
    };
  }

  const forwarded = (req.headers["x-forwarded-for"] as string) || "";
  req.ipAddress = forwarded.split(",")[0] || req.socket.remoteAddress || "";

  next();
}
