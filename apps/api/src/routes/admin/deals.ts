import { Router, type Request, type Response } from "express";
import { requireAuth } from "../../middleware/auth.js";
import prisma from "../../lib/prisma.js";
import { isSuperAdmin } from "../../lib/roleHelpers.js";
import { logAdminActivity } from "../../lib/adminActivityLogger.js";
import { logDestructiveAction } from "../../lib/auditLogger.js";
import { logError } from "../../lib/logger.js";
import { sendSuccess, sendError } from "../../utils/apiResponse.js";

const router = Router();

// All routes require authentication
router.use(requireAuth);

/**
 * DELETE /api/admin/deals/:dealId
 * Delete a deal by ID
 * 
 * Requirements:
 * - Only SUPERADMIN can delete deals
 * - Returns 403 if unauthorized
 * - Returns 404 if deal not found
 * - Uses Prisma to delete
 */
router.delete("/:dealId", async (req: Request, res: Response) => {
  try {
    const { dealId } = req.params;
    const userId = req.user?.id;

    // Check authorization: only SUPERADMIN can delete
    if (!isSuperAdmin(req.user!)) {
      return sendError(res, "FORBIDDEN", "Only SUPERADMIN can delete deals", 403);
    }

    // Find the deal first
    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      select: {
        id: true,
        brandName: true,
        brandId: true,
        value: true,
        currency: true,
        stage: true,
        talentId: true,
      },
    });

    // Return 404 if deal not found
    if (!deal) {
      return sendError(res, "NOT_FOUND", "Deal not found", 404);
    }

    // Delete the deal
    await prisma.deal.delete({
      where: { id: dealId },
    });

    // Log the destructive action
    try {
      await Promise.all([
        logDestructiveAction(req as any, {
          action: "DEAL_DELETED",
          entityType: "Deal",
          entityId: deal.id,
          metadata: {
            dealName: deal.brandName,
            brandId: deal.brandId,
            value: deal.value,
            currency: deal.currency,
            stage: deal.stage,
            talentId: deal.talentId,
          },
        }),
        logAdminActivity(req as any, {
          event: "ADMIN_DEAL_DELETED",
          metadata: {
            dealId: deal.id,
            dealName: deal.brandName,
            brandId: deal.brandId,
          },
        }),
      ]);
    } catch (logErr) {
      console.error("[ADMIN_DEALS] Failed to log destructive action:", logErr);
      // Don't fail the deletion if logging fails
    }

    return sendSuccess(res, { success: true, dealId, message: "Deal deleted successfully" });
  } catch (error) {
    const dealId = req.params.dealId;
    console.error("[ADMIN_DEALS] Failed to delete deal:", error);
    logError("Failed to delete deal", error, { dealId, userId: req.user?.id });
    
    return sendError(
      res,
      "INTERNAL_SERVER_ERROR",
      error instanceof Error ? error.message : "Failed to delete deal",
      500
    );
  }
});

export default router;
