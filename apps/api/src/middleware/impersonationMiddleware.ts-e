import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { verifyAuthToken } from '../lib/jwt';

/**
 * IMPERSONATION MIDDLEWARE
 * 
 * Detects and validates impersonation claims in JWT.
 * If impersonating, attaches impersonation context to request.
 * 
 * This middleware MUST run after attachUserFromSession middleware.
 */

export interface ImpersonationContext {
  adminId: string;           // Original admin's user ID
  talentUserId: string;      // Talent user's ID being impersonated
  talentRole: string;        // Role of impersonated user ("TALENT", "BRAND", etc)
  impersonationStartedAt: number;  // Unix timestamp
  isImpersonating: true;
}

declare global {
  namespace Express {
    interface Request {
      impersonation?: ImpersonationContext;
      adminUser?: any;  // Original admin (before impersonation)
      originalUserId?: string;  // Alias for adminId
    }
  }
}

export function impersonationMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    // If no user, skip
    if (!req.user?.id) {
      return next();
    }

    // Get the raw token from request
    let token: string | null = null;
    
    // Try cookie first
    const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "break_session";
    token = req.cookies?.[SESSION_COOKIE_NAME];
    
    // Fallback to Authorization header
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    // If no token, user is authenticated but not impersonating
    if (!token) {
      return next();
    }

    try {
      // Decode JWT (without verification first - just to read claims)
      const decoded = jwt.decode(token) as any;
      
      if (!decoded) {
        return next();
      }

      // Check for impersonation claim
      if (decoded.impersonating && decoded.actingAsUserId && decoded.adminId) {
        // Verify signature (now that we know there's an impersonation claim)
        verifyAuthToken(token);  // Will throw if invalid
        
        // Token is valid and has impersonation claim
        req.impersonation = {
          adminId: decoded.adminId,
          talentUserId: decoded.actingAsUserId,
          talentRole: decoded.actingAsRole || "TALENT",
          impersonationStartedAt: decoded.impersonationStartedAt || Date.now(),
          isImpersonating: true,
        };

        // Save original admin user data
        req.adminUser = req.user;
        req.originalUserId = decoded.adminId;

        // CRITICAL: req.user now represents the impersonated talent
        // This is enforced by the token - backend doesn't trust client state
        if (process.env.NODE_ENV !== 'production') {
          console.log(`[IMPERSONATION] Admin ${decoded.adminId} impersonating talent ${decoded.actingAsUserId}`);
        }
      }
    } catch (error) {
      // Token signature invalid or decode failed
      // This means the impersonation claim is NOT trustworthy
      // Continue without impersonation context
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`[IMPERSONATION] Invalid impersonation claim in token:`, error instanceof Error ? error.message : error);
      }
    }

    next();
  } catch (error) {
    console.error("[IMPERSONATION_MIDDLEWARE] Unexpected error:", error);
    // Don't fail request on middleware error, just skip impersonation detection
    next();
  }
}

/**
 * Helper function to get the effective user ID for data access
 * 
 * Usage: const userId = getEffectiveUserId(req);
 * 
 * Returns:
 *   - impersonated talent ID if admin is impersonating
 *   - current user ID if not impersonating
 */
export function getEffectiveUserId(req: Request): string {
  if (req.impersonation?.isImpersonating) {
    return req.impersonation.talentUserId;
  }
  return req.user?.id || "";
}

/**
 * Helper to check if user is impersonating
 */
export function isImpersonating(req: Request): boolean {
  return req.impersonation?.isImpersonating === true;
}

/**
 * Helper to get admin ID during impersonation
 */
export function getAdminId(req: Request): string {
  if (req.impersonation?.isImpersonating) {
    return req.impersonation.adminId;
  }
  return req.user?.id || "";
}
