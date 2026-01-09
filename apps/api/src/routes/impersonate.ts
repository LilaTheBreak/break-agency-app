import { Router, Request, Response } from "express";
import { prisma } from "../db.js";
import { isSuperAdmin, isAdminOrSuperAdmin } from "../middleware/auth.js";
import { logAuditEvent } from "../services/auditLogger.js";

const router = Router();

// Middleware to ensure admin-only access
router.use(isAdminOrSuperAdmin);

interface ImpersonationRequest extends Request {
  user?: any;
  adminUser?: any;
}

/**
 * POST /admin/impersonate/start
 * 
 * Start impersonating a talent user
 * Only SUPERADMIN can impersonate
 * Returns a special token with impersonation context
 */
router.post("/start", isSuperAdmin, async (req: ImpersonationRequest, res: Response) => {
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

    // Log the impersonation start
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

    // Return impersonation context
    // In a real implementation, this would be encoded in a JWT token
    // For now, we return the context object that the frontend will store
    res.json({
      success: true,
      impersonationContext: {
        actingAsUserId: talentUserId,
        actingAsRole: talentUser.role,
        originalAdminId: adminUserId,
        talentName: talentUser.name,
        talentEmail: talentUser.email,
        startedAt: new Date().toISOString(),
      },
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
 */
router.post("/stop", async (req: ImpersonationRequest, res: Response) => {
  try {
    const adminUserId = req.user?.id;
    const { originalAdminId, actingAsUserId } = req.body;

    // Validation
    if (!adminUserId || !originalAdminId) {
      return res.status(401).json({ error: "Admin user not authenticated" });
    }

    // Security: Verify the admin ending impersonation is the same as who started it
    if (adminUserId !== originalAdminId) {
      return res.status(403).json({
        error: "Cannot end impersonation started by another admin",
      });
    }

    // Get client IP for audit log
    const clientIp =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
      (req.socket?.remoteAddress as string) ||
      "unknown";

    // Fetch talent user name for audit log
    const talentUser = actingAsUserId
      ? await prisma.user.findUnique({
          where: { id: actingAsUserId },
          select: { name: true, email: true, role: true },
        })
      : null;

    // Log the impersonation end
    await logAuditEvent({
      eventType: "IMPERSONATION_ENDED",
      userId: adminUserId,
      targetUserId: actingAsUserId || undefined,
      metadata: {
        talentName: talentUser?.name,
        talentEmail: talentUser?.email,
        talentRole: talentUser?.role,
        ipAddress: clientIp,
        duration: req.body.durationSeconds || "unknown",
      },
    });

    res.json({
      success: true,
      message: "Impersonation ended",
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
 * Useful for verifying if currently impersonating
 */
router.get("/status", async (req: ImpersonationRequest, res: Response) => {
  try {
    const impersonationContext = req.body?.impersonationContext;

    if (impersonationContext && impersonationContext.actingAsUserId) {
      return res.json({
        isImpersonating: true,
        context: impersonationContext,
      });
    }

    res.json({
      isImpersonating: false,
      context: null,
    });
  } catch (error) {
    console.error("[IMPERSONATE] Error checking status:", error);
    res.status(500).json({ error: "Failed to check impersonation status" });
  }
});

export default router;
