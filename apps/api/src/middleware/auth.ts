import type { Request, Response, NextFunction } from "express";
import { SESSION_COOKIE_NAME, verifyAuthToken } from "../lib/jwt.js";
import prisma from "../lib/prisma.js";
import { buildSessionUser } from "../lib/session.js";

export async function attachUserFromSession(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.[SESSION_COOKIE_NAME];
  console.log("[AUTH] Checking for cookie:", SESSION_COOKIE_NAME, "- Found:", !!token, "- All cookies:", Object.keys(req.cookies || {}));
  if (!token) {
    console.log("[AUTH] No token found in cookies");
    req.user = null;
    return next();
  }
  try {
    const payload = verifyAuthToken(token);
    console.log("[AUTH] Token verified, user ID:", payload.id);
    const user = await prisma.user.findUnique({
      where: { id: payload.id }
    });
    if (!user) {
      console.log("[AUTH] User not found in database");
      req.user = null;
      return next();
    }
    console.log("[AUTH] User found:", user.email, "role:", user.role);
    req.user = buildSessionUser(user);
  } catch (error) {
    console.warn("[AUTH] Invalid auth token", error);
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
