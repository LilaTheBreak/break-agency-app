import type { Request, Response, NextFunction } from "express";
import { SESSION_COOKIE_NAME, verifyAuthToken } from "../lib/jwt.js";
import prisma from "../lib/prisma.js";
import { buildSessionUser } from "../lib/session.js";

export async function attachUserFromSession(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.[SESSION_COOKIE_NAME];
  if (!token) {
    req.user = null;
    return next();
  }
  try {
    const payload = verifyAuthToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      include: {
        roles: { include: { role: true } }
      }
    });
    if (!user) {
      req.user = null;
      return next();
    }
    req.user = buildSessionUser(user);
  } catch (error) {
    console.warn("Invalid auth token", error);
    req.user = null;
  }
  next();
}

export function requireAuth(_req: Request, res: Response, next: NextFunction) {
  if (!_req.user?.id) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}
