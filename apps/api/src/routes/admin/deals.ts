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
 * GET /api/deals/closed
 * Get closed deals with financial summary
 * 
 * Query params:
 * - talentId: Filter by talent ID
 * - fromDate: Filter deals closed on or after this date (ISO 8601)
 * - toDate: Filter deals closed on or before this date (ISO 8601)
 * 
 * Returns:
 * {
 *   summary: {
 *     totalClosed: number,
 *     closedWonValue: number,
 *     closedLostValue: number,
 *     paid: number,
 *     unpaid: number,
 *     avgDealValue: number,
 *     largestDeal: number
 *   },
 *   deals: [{ id, brandName, value, currency, paymentStatus, closedAt, stage, ... }]
 * }
 */
router.get("/closed", async (req: Request, res: Response) => {
  try {
    const { talentId, fromDate, toDate } = req.query;
    const userId = req.user?.id;

    console.log("[CLOSED_DEALS] Fetching closed deals:", { talentId, fromDate, toDate });

    if (!talentId || typeof talentId !== "string") {
      return sendError(res, "VALIDATION_ERROR", "talentId is required", 400);
    }

    // Parse and validate dates if provided
    let fromDateObj: Date | null = null;
    let toDateObj: Date | null = null;

    if (fromDate && typeof fromDate === "string") {
      fromDateObj = new Date(fromDate);
      if (isNaN(fromDateObj.getTime())) {
        return sendError(res, "VALIDATION_ERROR", "fromDate must be valid ISO 8601 date", 400);
      }
    }

    if (toDate && typeof toDate === "string") {
      toDateObj = new Date(toDate);
      if (isNaN(toDateObj.getTime())) {
        return sendError(res, "VALIDATION_ERROR", "toDate must be valid ISO 8601 date", 400);
      }
    }

    // Build where clause: CLOSED_WON or COMPLETED for won deals, LOST for lost deals
    const whereClause: any = {
      talentId,
      stage: {
        in: ["COMPLETED", "LOST"],
      },
    };

    // Add date filters if provided
    if (fromDateObj) {
      whereClause.closedAt = whereClause.closedAt || {};
      whereClause.closedAt.gte = fromDateObj;
    }
    if (toDateObj) {
      whereClause.closedAt = whereClause.closedAt || {};
      whereClause.closedAt.lte = toDateObj;
    }

    console.log("[CLOSED_DEALS] Query where clause:", JSON.stringify(whereClause));

    // Fetch closed deals
    const closedDeals = await prisma.deal.findMany({
      where: whereClause,
      select: {
        id: true,
        brandName: true,
        brandId: true,
        value: true,
        currency: true,
        paymentStatus: true,
        closedAt: true,
        stage: true,
        campaignName: true,
        notes: true,
      },
      orderBy: { closedAt: "desc" },
    });

    console.log("[CLOSED_DEALS] Found", closedDeals.length, "closed deals");

    // Calculate metrics
    const totalClosed = closedDeals.length;
    const closedWonDeals = closedDeals.filter((d) => d.stage === "COMPLETED");
    const closedLostDeals = closedDeals.filter((d) => d.stage === "LOST");

    const closedWonValue = closedWonDeals.reduce((sum, d) => sum + (d.value || 0), 0);
    const closedLostValue = closedLostDeals.reduce((sum, d) => sum + (d.value || 0), 0);

    const paidDeals = closedDeals.filter((d) => d.paymentStatus === "PAID");
    const unpaidDeals = closedDeals.filter((d) => d.paymentStatus !== "PAID");

    const paid = paidDeals.reduce((sum, d) => sum + (d.value || 0), 0);
    const unpaid = unpaidDeals.reduce((sum, d) => sum + (d.value || 0), 0);

    const avgDealValue = totalClosed > 0 ? Math.round((closedWonValue + closedLostValue) / totalClosed) : 0;
    const largestDeal = totalClosed > 0 ? Math.max(...closedDeals.map((d) => d.value || 0)) : 0;

    const summary = {
      totalClosed,
      closedWonValue,
      closedLostValue,
      paid,
      unpaid,
      avgDealValue,
      largestDeal,
    };

    console.log("[CLOSED_DEALS] Summary:", summary);

    return sendSuccess(res, { summary, deals: closedDeals }, 200, "Closed deals retrieved");
  } catch (error) {
    const talentId = req.query.talentId;
    console.error("[CLOSED_DEALS] Error fetching closed deals:", error);
    logError("Failed to fetch closed deals", error, { talentId, userId: req.user?.id });

    return sendError(
      res,
      "CLOSED_DEALS_FETCH_FAILED",
      error instanceof Error ? error.message : "Failed to fetch closed deals",
      500
    );
  }
});

/**
 * POST /api/admin/deals/closed/export
 * Export closed deals as CSV or PDF
 * 
 * Body:
 * - talentId: Talent ID to filter (required)
 * - format: 'csv' or 'pdf' (default: 'csv')
 * - fromDate: Optional date filter (ISO 8601)
 * - toDate: Optional date filter (ISO 8601)
 */
router.post("/closed/export", async (req: Request, res: Response) => {
  try {
    const { talentId, format = "csv", fromDate, toDate } = req.body;
    const userId = req.user?.id;

    console.log("[CLOSED_DEALS_EXPORT] Exporting closed deals:", { talentId, format });

    if (!talentId || typeof talentId !== "string") {
      return sendError(res, "VALIDATION_ERROR", "talentId is required", 400);
    }

    if (format !== "csv" && format !== "pdf") {
      return sendError(res, "VALIDATION_ERROR", "format must be 'csv' or 'pdf'", 400);
    }

    // Parse and validate dates if provided
    let fromDateObj: Date | null = null;
    let toDateObj: Date | null = null;

    if (fromDate && typeof fromDate === "string") {
      fromDateObj = new Date(fromDate);
      if (isNaN(fromDateObj.getTime())) {
        return sendError(res, "VALIDATION_ERROR", "fromDate must be valid ISO 8601 date", 400);
      }
    }

    if (toDate && typeof toDate === "string") {
      toDateObj = new Date(toDate);
      if (isNaN(toDateObj.getTime())) {
        return sendError(res, "VALIDATION_ERROR", "toDate must be valid ISO 8601 date", 400);
      }
    }

    // Build where clause
    const whereClause: any = {
      talentId,
      stage: {
        in: ["COMPLETED", "LOST"],
      },
    };

    if (fromDateObj) {
      whereClause.closedAt = whereClause.closedAt || {};
      whereClause.closedAt.gte = fromDateObj;
    }
    if (toDateObj) {
      whereClause.closedAt = whereClause.closedAt || {};
      whereClause.closedAt.lte = toDateObj;
    }

    // Fetch closed deals
    const closedDeals = await prisma.deal.findMany({
      where: whereClause,
      select: {
        id: true,
        brandName: true,
        brandId: true,
        value: true,
        currency: true,
        paymentStatus: true,
        closedAt: true,
        stage: true,
        campaignName: true,
        notes: true,
      },
      orderBy: { closedAt: "desc" },
    });

    console.log("[CLOSED_DEALS_EXPORT] Found", closedDeals.length, "deals to export");

    if (format === "csv") {
      // Generate CSV
      const headers = ["Brand", "Campaign", "Status", "Value", "Currency", "Payment Status", "Closed Date", "Notes"];
      const rows = closedDeals.map((deal) => [
        deal.brandName || "",
        deal.campaignName || "",
        deal.stage === "COMPLETED" ? "Won" : "Lost",
        (deal.value || 0).toString(),
        deal.currency || "USD",
        deal.paymentStatus || "",
        deal.closedAt ? new Date(deal.closedAt).toLocaleDateString("en-GB") : "",
        (deal.notes || "").replace(/"/g, '""'), // Escape quotes in CSV
      ]);

      const csv = [
        headers.join(","),
        ...rows.map((row) =>
          row
            .map((cell) => {
              // Quote cells containing commas, quotes, or newlines
              if (cell.includes(",") || cell.includes('"') || cell.includes("\n")) {
                return `"${cell}"`;
              }
              return cell;
            })
            .join(",")
        ),
      ].join("\n");

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="closed-deals-${talentId}-${new Date().toISOString().split('T')[0]}.csv"`);
      return res.send(csv);
    } else if (format === "pdf") {
      // Generate PDF - using simple HTML table approach with newline separation
      // For a production system, consider using a library like jsPDF or pdfkit
      const pdfContent = generatePDFContent(closedDeals, talentId);
      
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="closed-deals-${talentId}-${new Date().toISOString().split('T')[0]}.pdf"`);
      return res.send(pdfContent);
    }
  } catch (error) {
    const talentId = req.body?.talentId;
    console.error("[CLOSED_DEALS_EXPORT] Error exporting closed deals:", error);
    logError("Failed to export closed deals", error, { talentId, userId: req.user?.id });

    return sendError(
      res,
      "CLOSED_DEALS_EXPORT_FAILED",
      error instanceof Error ? error.message : "Failed to export closed deals",
      500
    );
  }
});

/**
 * Helper function to generate PDF content
 * Creates a basic PDF-like text document
 */
function generatePDFContent(
  deals: Array<{
    brandName: string | null;
    campaignName: string | null;
    value: number | null;
    currency: string | null;
    paymentStatus: string | null;
    closedAt: Date | null;
    stage: string;
    notes: string | null;
  }>,
  talentId: string
): Buffer {
  // For basic PDF export, use a simple text-based approach
  // Production systems should use jsPDF or pdfkit
  const lines: string[] = [];
  
  lines.push("CLOSED DEALS EXPORT");
  lines.push(`Talent ID: ${talentId}`);
  lines.push(`Generated: ${new Date().toLocaleDateString("en-GB")} ${new Date().toLocaleTimeString("en-GB")}`);
  lines.push("");
  lines.push("=" .repeat(80));
  lines.push("");
  
  // Summary
  const totalClosed = deals.length;
  const totalWon = deals.filter((d) => d.stage === "COMPLETED").length;
  const totalLost = deals.filter((d) => d.stage === "LOST").length;
  const totalValue = deals.reduce((sum, d) => sum + (d.value || 0), 0);
  const paidValue = deals.filter((d) => d.paymentStatus === "PAID").reduce((sum, d) => sum + (d.value || 0), 0);
  
  lines.push("SUMMARY");
  lines.push(`Total Closed Deals: ${totalClosed}`);
  lines.push(`Won: ${totalWon}, Lost: ${totalLost}`);
  lines.push(`Total Value: ${totalValue}`);
  lines.push(`Paid: ${paidValue}`);
  lines.push("");
  lines.push("=" .repeat(80));
  lines.push("");
  
  // Deals table
  lines.push("DEALS");
  lines.push("");
  
  deals.forEach((deal, idx) => {
    lines.push(`${idx + 1}. ${deal.brandName || "Unknown Brand"}`);
    lines.push(`   Campaign: ${deal.campaignName || "—"}`);
    lines.push(`   Status: ${deal.stage === "COMPLETED" ? "WON" : "LOST"}`);
    lines.push(`   Value: ${deal.currency || "USD"} ${(deal.value || 0).toLocaleString()}`);
    lines.push(`   Payment: ${deal.paymentStatus || "—"}`);
    lines.push(`   Closed: ${deal.closedAt ? new Date(deal.closedAt).toLocaleDateString("en-GB") : "—"}`);
    if (deal.notes) {
      lines.push(`   Notes: ${deal.notes}`);
    }
    lines.push("");
  });
  
  return Buffer.from(lines.join("\n"), "utf-8");
}

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
