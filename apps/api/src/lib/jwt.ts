import jwt from "jsonwebtoken";
import type { Response } from "express";

const DEFAULT_EXPIRY = "7d";
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
export const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "break_session";

interface SignOptions {
  expiresIn?: string;
}

export function createAuthToken(payload: { id: string }, options: SignOptions = {}) {
  const secret = getJwtSecret();
  return jwt.sign(payload, secret, { expiresIn: options.expiresIn || DEFAULT_EXPIRY });
}

export function verifyAuthToken(token: string): { id: string } {
  const secret = getJwtSecret();
  return jwt.verify(token, secret) as { id: string };
}

export function setAuthCookie(res: Response, token: string) {
  const config = buildCookieConfig();
  console.log("[COOKIE] Setting cookie with config:", JSON.stringify(config));
  res.cookie(SESSION_COOKIE_NAME, token, config);
}

export function clearAuthCookie(res: Response) {
  res.cookie(SESSION_COOKIE_NAME, "", {
    ...buildCookieConfig(),
    maxAge: 0
  });
}

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }
  return secret;
}

// 🔒 Updated cookie config for correct Dev vs Prod behaviour
// Dev (localhost):       SameSite=Lax, Secure=false, no domain
// Prod (custom domain):  SameSite=None, Secure=true, domain from COOKIE_DOMAIN/SESSION_COOKIE_DOMAIN
function buildCookieConfig() {
  const isProd = process.env.NODE_ENV === "production";
  const usesHttps = process.env.USE_HTTPS === "true";
  
  // In development (localhost), always use lax/false regardless of USE_HTTPS
  // This ensures cookies work on http://localhost:5173
  if (!isProd) {
    return {
      httpOnly: true,
      secure: false,
      sameSite: "lax" as const,
      maxAge: COOKIE_MAX_AGE,
      path: "/",
      domain: undefined
    };
  }

  // In production, use secure cookies with proper domain
  const domain =
    process.env.COOKIE_DOMAIN ||
    process.env.SESSION_COOKIE_DOMAIN ||
    ".tbctbctbc.online";

  return {
    httpOnly: true,
    secure: true,
    sameSite: "none" as const,
    maxAge: COOKIE_MAX_AGE,
    path: "/",
    domain
  };
}
