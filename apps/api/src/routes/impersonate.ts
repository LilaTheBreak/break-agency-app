import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../db/client.js";
import { isSuperAdmin } from "../lib/roleHelpers.js";
import { requireAuth } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import { logAuditEvent } from "../services/auditLogger.js";
import { setAuthCookie, SESSION_COOKIE_NAME } from "../lib/jwt.js";

const router = Router();

// PRODUCTION SAFETY: Kill switch for impersonation feature
const IMPERSONATION_ENABLED = process.env.IMPERSONATION_ENABLED === "true";

// Middleware: Require authentication (will add SUPERADMIN checks in individual routes)
router.use(requireAuth);

// PRODUCTION SAFETY: Check kill switch on all impersonation routes
router.use((req: Request, res: Response, next) => {
  if (!IMPERSONATION_ENABLED) {
    console.warn(`[IMPERSONATION GUARD] Kill switch active - blocking impersonation attempt from ${req.user?.email}`);
    return res.status(403).json({
      error: "Impersonation temporarily disabled",
      message: "The impersonation feature is currently disabled for production safety. Please contact support."
    });
  }
  next();
});

interface ImpersonationRequest extends Request {
  user?: any;
  adminUser?: any;
}

/**
 * POST /admin/impersonate/start
 * 
 * Start impersonating a talent user
 * Only SUPERADMIN can impersonate
 * Returns impersonation context to be stored in JWT
 */
router.post("/start", (req: ImpersonationRequest, res: Response, next) => {
  // Explicit SUPERADMIN check (no implicit trust)
  if (!req.user?.id) {
    return res.status(401).json({ error: "Admin user not authenticated" });
  }
  
  if (!isSuperAdmin(req.user)) {
    return res.status(403).json({ 
      error: "Only SUPERADMIN can impersonate",
      code: "SUPERADMIN_REQUIRED"
    });
  }
  
  next();
}, async (req: ImpersonationRequest, res: Response) => {
  try {
    const { talentUserId } = req.body;
    const adminUserId = req.user?.id;

    // Validation
    if (!talentUserId) {
      return res.status(400).json({ error: "talentUserId is required" });
    }

    if (!adminUserId) {
      return res.status(401).json({ error: "Admin user not authenticated" });
    }

    // Fetch the talent user
    const talentUser = await prisma.user.findUnique({
      where: { id: talentUserId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
      },
    });

    if (!talentUser) {
      return res.status(404).json({ error: "Talent user not found" });
    }

    // Security: Cannot impersonate other admins or founders
    if (
      talentUser.role === "ADMIN" ||
      talentUser.role === "SUPERADMIN" ||
      talentUser.role === "FOUNDER"
    ) {
      return res.status(403).json({
        error: "Cannot impersonate admin, superadmin, or founder users",
      });
    }

    // Get client IP for audit log
    const clientIp =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
      (req.socket?.remoteAddress as string) ||
      "unknown";

    // PHASE 2: Issue new JWT with impersonation claim
    // This token contains the impersonation context signed by backend
    const impersonationStartedAt = Date.now();
    
    const impersonationPayload = {
      id: talentUserId,  // req.user.id will be talent ID
      adminId: adminUserId,  // Original admin preserved in token
      impersonating: true,
      actingAsUserId: talentUserId,  // Talent being impersonated
      actingAsRole: talentUser.role,
      impersonationStartedAt,
    };

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ error: "JWT_SECRET not configured" });
    }

    const impersonationToken = jwt.sign(impersonationPayload, secret, {
      expiresIn: "7d"  // Same as regular auth token
    });

    // Set the impersonation token as the session cookie
    // This ensures subsequent requests use the impersonation context
    setAuthCookie(res, impersonationToken);

    // Log the impersonation start (server-side, backend-generated)
    await logAuditEvent({
      eventType: "IMPERSONATION_STARTED",
      userId: adminUserId,
      targetUserId: talentUserId,
      metadata: {
        talentName: talentUser.name,
        talentEmail: talentUser.email,
        talentRole: talentUser.role,
        ipAddress: clientIp,
      },
    });

    // Return success with token details
    // Frontend stores this token but does NOT construct the impersonation context
    // Backend validates token on every request
    res.json({
      success: true,
      impersonationStarted: {
        talentId: talentUserId,
        talentName: talentUser.name,
        talentEmail: talentUser.email,
        talentRole: talentUser.role,
        startedAt: new Date(impersonationStartedAt).toISOString(),
      },
      // Token is already in HTTP-only cookie, but also return it for Bearer token usage
      token: impersonationToken,
    });
  } catch (error) {
    console.error("[IMPERSONATE] Error starting impersonation:", error);
    res.status(500).json({ error: "Failed to start impersonation" });
  }
});

/**
 * POST /admin/impersonate/stop
 * 
 * Stop impersonating and return to admin mode
 * Validates that admin is actually impersonating (checked by JWT claim)
 * Duration is calculated server-side, not trusted from client
 */
router.post("/stop", async (req: ImpersonationRequest, res: Response) => {
  try {
    const adminUserId = req.user?.id;

    // Validation: Must be authenticated
    if (!adminUserId) {
      return res.status(401).json({ error: "Admin user not authenticated" });
    }

    // Validation: Only SUPERADMIN can stop impersonation
    if (!isSuperAdmin(req.user)) {
      return res.status(403).json({ 
        error: "Only SUPERADMIN can stop impersonation",
        code: "SUPERADMIN_REQUIRED"
      });
    }

    // Validation: Must actually be impersonating
    if (!req.impersonation?.isImpersonating) {
      return res.status(400).json({ 
        error: "Not currently impersonating - cannot stop",
        code: "NOT_IMPERSONATING"
      });
    }

    const talentUserId = req.impersonation.talentUserId;
    const startedAtMs = req.impersonation.impersonationStartedAt;
    const durationSeconds = Math.floor((Date.now() - startedAtMs) / 1000);

    // Get client IP for audit log
    const clientIp =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
      (req.socket?.remoteAddress as string) ||
      "unknown";

    // Fetch talent user name for audit log
    const talentUser = await prisma.user.findUnique({
      where: { id: talentUserId },
      select: { name: true, email: true, role: true },
    });

    // Log the impersonation end - using server-calculated duration
    await logAuditEvent({
      eventType: "IMPERSONATION_ENDED",
      userId: adminUserId,
      targetUserId: talentUserId,
      metadata: {
        talentName: talentUser?.name,
        talentEmail: talentUser?.email,
        talentRole: talentUser?.role,
        ipAddress: clientIp,
        durationSeconds,  // Server-calculated, not trusted from client
      },
    });

    // Clear the impersonation token by clearing the auth cookie
    // Subsequent requests will use the previous auth token (for the admin)
    // For now, we just respond with success
    // Frontend should redirect or refresh to reset the session
    res.json({
      success: true,
      message: "Impersonation ended",
      durationSeconds,
    });
  } catch (error) {
    console.error("[IMPERSONATE] Error stopping impersonation:", error);
    res.status(500).json({ error: "Failed to stop impersonation" });
  }
});

/**
 * GET /admin/impersonate/status
 * 
 * Check current impersonation status
 * The middleware will detect impersonation claims in JWT and attach to request
 */
router.get("/status", (req: ImpersonationRequest, res: Response) => {
  try {
    const adminUserId = req.user?.id;

    if (!adminUserId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Validation: Only SUPERADMIN can check impersonation status
    if (!isSuperAdmin(req.user)) {
      return res.status(403).json({ 
        error: "Only SUPERADMIN can check impersonation status",
        code: "SUPERADMIN_REQUIRED"
      });
    }

    // Check if request has impersonation context (set by impersonationMiddleware)
    if (req.impersonation?.isImpersonating) {
      return res.json({
        isImpersonating: true,
        adminId: req.impersonation.adminId,
        talentId: req.impersonation.talentUserId,
        talentRole: req.impersonation.talentRole,
        startedAt: new Date(req.impersonation.impersonationStartedAt).toISOString(),
      });
    }

    // Not impersonating
    res.json({
      isImpersonating: false,
    });
  } catch (error) {
    console.error("[IMPERSONATE] Error checking status:", error);
    res.status(500).json({ error: "Failed to check impersonation status" });
  }
});

export default router;
