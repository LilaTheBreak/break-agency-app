import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { env } from "../env.js";
import { HttpError } from "./problem-details.js";

export interface AuthUser {
  id: string;
  role: string;
  email: string;
  name?: string;
}

function decodeToken(token: string): AuthUser {
  try {
    return jwt.verify(token, env.JWT_SECRET) as AuthUser;
  } catch {
    throw new HttpError(401, "Invalid authentication token");
  }
}

export function authenticate(optional = false) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const token =
      req.cookies?.session ||
      req.headers.authorization?.replace(/^Bearer\s+/i, "");

    if (!token) {
      if (optional) return next();
      return next(new HttpError(401, "Authentication required"));
    }

    try {
      req.user = decodeToken(token);
      return next();
    } catch (error) {
      if (optional) return next();
      return next(error);
    }
  };
}

export function requireRole(roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new HttpError(401, "Authentication required"));
    }
    if (!roles.includes(req.user.role)) {
      return next(new HttpError(403, "Insufficient permissions"));
    }
    return next();
  };
}
