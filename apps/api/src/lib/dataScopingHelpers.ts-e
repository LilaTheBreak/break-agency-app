import type { Request } from "express";

/**
 * DATA SCOPING HELPER FUNCTIONS
 * 
 * These helpers ensure that admins impersonating talent can only access
 * that talent's data, not data from other talents.
 * 
 * Backend enforces this - not UI.
 */

export function getEffectiveUserId(req: Request): string {
  if (req.impersonation?.isImpersonating) {
    return req.impersonation.talentUserId;
  }
  return req.user?.id || "";
}

export function isImpersonating(req: Request): boolean {
  return req.impersonation?.isImpersonating === true;
}

/**
 * Enforce that user can only access data for the current effective user.
 * Used to prevent admins from accessing other talent's data while impersonating.
 * 
 * Usage:
 *   const requestedUserId = req.query.userId as string;
 *   enforceDataScoping(req, requestedUserId);
 */
export function enforceDataScoping(req: Request, requestedUserId: string): void {
  const effectiveUserId = getEffectiveUserId(req);
  
  // If impersonating, only allow access to impersonated talent's data
  if (isImpersonating(req) && requestedUserId !== effectiveUserId) {
    throw {
      statusCode: 403,
      message: `Cannot access data for user ${requestedUserId} while impersonating ${effectiveUserId}`,
      code: "DATA_SCOPING_VIOLATION"
    };
  }
}

/**
 * Enforce that admin-only operations (like accessing admin routes) cannot be done while impersonating.
 * 
 * Usage:
 *   blockAdminActionsWhileImpersonating(req);
 */
export function blockAdminActionsWhileImpersonating(req: Request): void {
  if (isImpersonating(req)) {
    throw {
      statusCode: 403,
      message: "Cannot perform admin-only actions while impersonating a talent",
      code: "ADMIN_ACTION_BLOCKED"
    };
  }
}
