import type { Request, Response, NextFunction } from "express";

/**
 * IMPERSONATION PRODUCTION SAFETY GUARDS
 * 
 * These middleware ensure safe impersonation in production:
 * 1. Kill switch to disable feature entirely
 * 2. Write blocking (read-only mode while impersonating)
 * 3. Request logging for audit trail
 */

const IMPERSONATION_ENABLED = process.env.IMPERSONATION_ENABLED === "true";

/**
 * GUARD 1: Kill Switch
 * 
 * If IMPERSONATION_ENABLED=false, all impersonation is blocked.
 * This allows instant disable without redeploying.
 */
export function impersonationKillSwitch(req: Request, res: Response, next: NextFunction) {
  // Only check on impersonation endpoints
  if (req.path.includes("/impersonate")) {
    if (!IMPERSONATION_ENABLED) {
      console.warn(`[IMPERSONATION GUARD] Kill switch active - blocking impersonation attempt from ${req.user?.email}`);
      return res.status(403).json({
        error: "Impersonation temporarily disabled",
        message: "The impersonation feature is currently disabled. Please try again later."
      });
    }
  }
  next();
}

/**
 * GUARD 2: Write Blocker
 * 
 * While impersonating, only allow GET/HEAD/OPTIONS requests.
 * All write operations (POST/PUT/DELETE/PATCH) are blocked.
 * 
 * This ensures:
 * - Read-only access to talent's data
 * - Zero chance of accidental mutations
 * - Safer testing in production
 */
export function impersonationWriteBlocker(req: Request, res: Response, next: NextFunction) {
  if (req.impersonation?.isImpersonating) {
    const method = req.method.toUpperCase();
    const isWriteMethod = ["POST", "PUT", "DELETE", "PATCH"].includes(method);
    
    if (isWriteMethod) {
      console.warn(`[IMPERSONATION GUARD] Write blocked while impersonating`, {
        adminId: req.impersonation.adminId,
        talentId: req.impersonation.talentUserId,
        method: method,
        route: req.originalUrl,
        timestamp: new Date().toISOString()
      });
      
      return res.status(403).json({
        error: "Write operations disabled while impersonating",
        message: `${method} requests are not allowed during impersonation. This feature is read-only.`,
        details: {
          attemptedMethod: method,
          allowedMethods: ["GET", "HEAD", "OPTIONS"]
        }
      });
    }
  }
  next();
}

/**
 * GUARD 3: Audit Logging
 * 
 * Log all requests while impersonating for audit trail.
 * Helps detect:
 * - Unexpected routes being accessed
 * - Suspicious access patterns
 * - Potential abuse
 */
export function impersonationAuditLog(req: Request, res: Response, next: NextFunction) {
  if (req.impersonation?.isImpersonating) {
    // Log the request
    const logEntry = {
      timestamp: new Date().toISOString(),
      adminId: req.impersonation.adminId,
      talentId: req.impersonation.talentUserId,
      talentRole: req.impersonation.talentRole,
      method: req.method,
      route: req.originalUrl,
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.get("user-agent")
    };
    
    // Log at INFO level for visibility
    console.info("[IMPERSONATION]", JSON.stringify(logEntry));
    
    // Attach to request for potential later use
    (req as any).impersonationLog = logEntry;
  }
  next();
}

/**
 * Get current impersonation status
 */
export function isImpersonationEnabled(): boolean {
  return IMPERSONATION_ENABLED;
}

/**
 * For monitoring/status endpoints
 */
export function impersonationStatus() {
  return {
    enabled: IMPERSONATION_ENABLED,
    readOnlyMode: true,
    timestamp: new Date().toISOString()
  };
}
