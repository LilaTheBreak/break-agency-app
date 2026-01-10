import { Router, type Request, type Response } from "express";
import { requireAuth } from "../../middleware/auth.js";
import prisma from "../../lib/prisma.js";
import { isSuperAdmin } from "../../lib/roleHelpers.js";
import { logAdminActivity } from "../../lib/adminActivityLogger.js";
import { logDestructiveAction } from "../../lib/auditLogger.js";
import { logError } from "../../lib/logger.js";
import { sendSuccess, sendError } from "../../utils/apiResponse.js";
import { 
  updateScheduledExport, 
  getScheduleForTalent 
} from "../../services/scheduledExportService.js";

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
 * Export closed deals as CSV, PDF, or XLSX
 * 
 * Body:
 * - talentId: Talent ID to filter (required)
 * - format: 'csv', 'pdf', or 'xlsx' (default: 'csv')
 * - fromDate: Optional date filter (ISO 8601)
 * - toDate: Optional date filter (ISO 8601)
 * - selectedFields: Optional array of fields to include in export
 */
router.post("/closed/export", async (req: Request, res: Response) => {
  try {
    const { talentId, format = "csv", fromDate, toDate, selectedFields } = req.body;
    const userId = req.user?.id;

    console.log("[CLOSED_DEALS_EXPORT] Exporting closed deals:", { talentId, format });

    if (!talentId || typeof talentId !== "string") {
      return sendError(res, "VALIDATION_ERROR", "talentId is required", 400);
    }

    if (format !== "csv" && format !== "pdf" && format !== "xlsx") {
      return sendError(res, "VALIDATION_ERROR", "format must be 'csv', 'pdf', or 'xlsx'", 400);
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

    // Default fields if none specified
    const defaultFields = ["brand", "campaign", "status", "value", "currency", "paymentStatus", "closedDate", "notes"];
    const fieldsToExport = selectedFields && Array.isArray(selectedFields) ? selectedFields : defaultFields;

    if (format === "csv") {
      const csvContent = generateCSV(closedDeals, fieldsToExport);
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="closed-deals-${talentId}-${new Date().toISOString().split('T')[0]}.csv"`);
      return res.send(csvContent);
    } else if (format === "xlsx") {
      const xlsxBuffer = generateXLSX(closedDeals, fieldsToExport, talentId);
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename="closed-deals-${talentId}-${new Date().toISOString().split('T')[0]}.xlsx"`);
      return res.send(xlsxBuffer);
    } else if (format === "pdf") {
      const pdfBuffer = await generateAdvancedPDF(closedDeals, fieldsToExport, talentId);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="closed-deals-${talentId}-${new Date().toISOString().split('T')[0]}.pdf"`);
      return res.send(pdfBuffer);
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
 * Generate CSV content
 */
function generateCSV(
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
  fieldsToExport: string[]
): string {
  const fieldMap: Record<string, (deal: any) => string> = {
    brand: (d) => d.brandName || "",
    campaign: (d) => d.campaignName || "",
    status: (d) => (d.stage === "COMPLETED" ? "Won" : "Lost"),
    value: (d) => (d.value || 0).toString(),
    currency: (d) => d.currency || "USD",
    paymentStatus: (d) => d.paymentStatus || "",
    closedDate: (d) => (d.closedAt ? new Date(d.closedAt).toLocaleDateString("en-GB") : ""),
    notes: (d) => (d.notes || "").replace(/"/g, '""'),
  };

  const fieldLabels: Record<string, string> = {
    brand: "Brand",
    campaign: "Campaign",
    status: "Status",
    value: "Value",
    currency: "Currency",
    paymentStatus: "Payment Status",
    closedDate: "Closed Date",
    notes: "Notes",
  };

  const headers = fieldsToExport.map((f) => fieldLabels[f] || f);
  const rows = deals.map((deal) =>
    fieldsToExport.map((field) => {
      const value = fieldMap[field] ? fieldMap[field](deal) : "";
      // Quote cells containing commas, quotes, or newlines
      if (value.includes(",") || value.includes('"') || value.includes("\n")) {
        return `"${value}"`;
      }
      return value;
    })
  );

  const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
  return csv;
}

/**
 * Generate XLSX content using xlsx library
 */
function generateXLSX(
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
  fieldsToExport: string[],
  talentId: string
): Buffer {
  // Dynamic import of xlsx for better compatibility
  const XLSX = require("xlsx");

  const fieldMap: Record<string, (deal: any) => any> = {
    brand: (d) => d.brandName || "",
    campaign: (d) => d.campaignName || "",
    status: (d) => (d.stage === "COMPLETED" ? "Won" : "Lost"),
    value: (d) => d.value || 0,
    currency: (d) => d.currency || "USD",
    paymentStatus: (d) => d.paymentStatus || "",
    closedDate: (d) => (d.closedAt ? new Date(d.closedAt).toLocaleDateString("en-GB") : ""),
    notes: (d) => d.notes || "",
  };

  const fieldLabels: Record<string, string> = {
    brand: "Brand",
    campaign: "Campaign",
    status: "Status",
    value: "Value",
    currency: "Currency",
    paymentStatus: "Payment Status",
    closedDate: "Closed Date",
    notes: "Notes",
  };

  // Create workbook with two sheets: data and summary
  const wb = XLSX.utils.book_new();

  // Summary sheet
  const totalClosed = deals.length;
  const totalWon = deals.filter((d) => d.stage === "COMPLETED").length;
  const totalLost = deals.filter((d) => d.stage === "LOST").length;
  const totalValue = deals.reduce((sum, d) => sum + (d.value || 0), 0);
  const paidValue = deals.filter((d) => d.paymentStatus === "PAID").reduce((sum, d) => sum + (d.value || 0), 0);
  const unpaidValue = totalValue - paidValue;

  const summaryData = [
    { Metric: "Total Closed Deals", Value: totalClosed },
    { Metric: "Won", Value: totalWon },
    { Metric: "Lost", Value: totalLost },
    { Metric: "Total Value", Value: totalValue },
    { Metric: "Paid", Value: paidValue },
    { Metric: "Unpaid", Value: unpaidValue },
    { Metric: "Export Date", Value: new Date().toLocaleDateString("en-GB") },
  ];

  const summaryWs = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");

  // Data sheet
  const dealsData = deals.map((deal) => {
    const row: Record<string, any> = {};
    fieldsToExport.forEach((field) => {
      const label = fieldLabels[field] || field;
      row[label] = fieldMap[field] ? fieldMap[field](deal) : "";
    });
    return row;
  });

  const dealsWs = XLSX.utils.json_to_sheet(dealsData);
  
  // Set column widths
  const maxWidth = 20;
  const colWidths = fieldsToExport.map((f) => ({ wch: Math.min(maxWidth, (fieldLabels[f] || f).length + 2) }));
  dealsWs["!cols"] = colWidths;

  XLSX.utils.book_append_sheet(wb, dealsWs, "Closed Deals");

  // Generate buffer
  const buffer = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });
  return buffer;
}

/**
 * Generate advanced PDF using pdfkit
 */
async function generateAdvancedPDF(
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
  fieldsToExport: string[],
  talentId: string
): Promise<Buffer> {
  const PDFDocument = require("pdfkit");
  const { PassThrough } = require("stream");

  return new Promise((resolve, reject) => {
    const stream = new PassThrough();
    const chunks: any[] = [];

    stream.on("data", (chunk: any) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);

    const doc = new PDFDocument({ size: "A4", margin: 50 });
    doc.pipe(stream);

    // Header
    doc.fontSize(20).font("Helvetica-Bold").text("Closed Deals Report", 50, 50);
    doc.fontSize(10).font("Helvetica").text(`Talent ID: ${talentId}`, 50, 80);
    doc.text(`Generated: ${new Date().toLocaleDateString("en-GB")} ${new Date().toLocaleTimeString("en-GB")}`, 50, 100);
    
    // Summary section
    doc.fontSize(14).font("Helvetica-Bold").text("Summary", 50, 140);
    const totalClosed = deals.length;
    const totalWon = deals.filter((d) => d.stage === "COMPLETED").length;
    const totalLost = deals.filter((d) => d.stage === "LOST").length;
    const totalValue = deals.reduce((sum, d) => sum + (d.value || 0), 0);
    const paidValue = deals.filter((d) => d.paymentStatus === "PAID").reduce((sum, d) => sum + (d.value || 0), 0);

    doc.fontSize(10).font("Helvetica");
    let summaryY = 165;
    doc.text(`Total Closed Deals: ${totalClosed}`, 50, summaryY);
    doc.text(`Won: ${totalWon}, Lost: ${totalLost}`, 50, (summaryY += 20));
    doc.text(`Total Value: £${totalValue.toLocaleString()}`, 50, (summaryY += 20));
    doc.text(`Paid: £${paidValue.toLocaleString()}`, 50, (summaryY += 20));

    // Table header
    doc.fontSize(11).font("Helvetica-Bold").text("Deals", 50, (summaryY += 40));

    const fieldLabels: Record<string, string> = {
      brand: "Brand",
      campaign: "Campaign",
      status: "Status",
      value: "Value",
      currency: "Currency",
      paymentStatus: "Payment Status",
      closedDate: "Closed Date",
      notes: "Notes",
    };

    const tableTop = summaryY + 25;
    const rowHeight = 20;
    const colWidths = fieldsToExport.length > 0 ? 480 / fieldsToExport.length : 480;

    // Draw table headers
    let xPos = 50;
    fieldsToExport.forEach((field) => {
      const label = fieldLabels[field] || field;
      doc.fontSize(9).font("Helvetica-Bold").text(label, xPos, tableTop, { width: colWidths });
      xPos += colWidths;
    });

    // Draw horizontal line
    doc.moveTo(50, tableTop + 15).lineTo(530, tableTop + 15).stroke();

    // Draw table rows
    let tableY = tableTop + 20;
    deals.forEach((deal) => {
      if (tableY > 700) {
        doc.addPage();
        tableY = 50;
      }

      xPos = 50;
      fieldsToExport.forEach((field) => {
        const fieldMap: Record<string, (deal: any) => string> = {
          brand: (d) => d.brandName || "",
          campaign: (d) => d.campaignName || "",
          status: (d) => (d.stage === "COMPLETED" ? "Won" : "Lost"),
          value: (d) => (d.value || 0).toString(),
          currency: (d) => d.currency || "USD",
          paymentStatus: (d) => d.paymentStatus || "",
          closedDate: (d) => (d.closedAt ? new Date(d.closedAt).toLocaleDateString("en-GB") : ""),
          notes: (d) => d.notes || "",
        };

        const value = fieldMap[field] ? fieldMap[field](deal) : "";
        doc.fontSize(8).font("Helvetica").text(value.substring(0, 30), xPos, tableY, { width: colWidths });
        xPos += colWidths;
      });

      tableY += rowHeight;

      // Draw horizontal line between rows
      doc.moveTo(50, tableY - 5).lineTo(530, tableY - 5).stroke("#cccccc");
    });

    // Footer
    doc.fontSize(8).font("Helvetica").text(`Page ${doc.bufferedPageRange().count}`, 50, 750, { align: "center" });

    doc.end();
  });
}

/**
 * Helper function to generate PDF content
 * Creates a basic PDF-like text document
 */
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

/**
 * POST /api/admin/deals/closed/schedule-export
 * Schedule weekly email export of closed deals
 * 
 * Body:
 * - talentId: Talent ID to filter (required)
 * - email: Email address to send to (required)
 * - frequency: 'weekly' or 'daily' (default: 'weekly')
 * - dayOfWeek: Day to send (0-6, Sunday=0) for weekly exports
 * - enabled: Boolean to enable/disable (default: true)
 */
router.post("/closed/schedule-export", async (req: Request, res: Response) => {
  try {
    const { talentId, email, frequency = "weekly", dayOfWeek = 1, enabled = true } = req.body;
    const userId = req.user?.id;

    console.log("[CLOSED_DEALS_SCHEDULE] Setting up scheduled export:", { talentId, email, frequency });

    if (!talentId || typeof talentId !== "string") {
      return sendError(res, "VALIDATION_ERROR", "talentId is required", 400);
    }

    if (!email || typeof email !== "string") {
      return sendError(res, "VALIDATION_ERROR", "email is required", 400);
    }

    if (frequency !== "daily" && frequency !== "weekly") {
      return sendError(res, "VALIDATION_ERROR", "frequency must be 'daily' or 'weekly'", 400);
    }

    if (dayOfWeek < 0 || dayOfWeek > 6) {
      return sendError(res, "VALIDATION_ERROR", "dayOfWeek must be 0-6", 400);
    }

    if (!userId) {
      return sendError(res, "UNAUTHORIZED", "User not authenticated", 401);
    }

    // Check if talent exists and user has access
    const talent = await prisma.talent.findUnique({
      where: { id: talentId },
      select: { id: true, userId: true },
    });

    if (!talent) {
      return sendError(res, "NOT_FOUND", "Talent not found", 404);
    }

    if (talent.userId !== userId) {
      return sendError(res, "FORBIDDEN", "You do not have access to this talent", 403);
    }

    const schedule = await updateScheduledExport(talentId, userId, {
      email,
      frequency: frequency as "daily" | "weekly",
      dayOfWeek,
      enabled,
    });

    console.log("[CLOSED_DEALS_SCHEDULE] Export schedule saved");

    return sendSuccess(res, {
      success: true,
      talentId,
      schedule,
      message: enabled ? "Export schedule enabled" : "Export schedule disabled",
    });
  } catch (error) {
    console.error("[CLOSED_DEALS_SCHEDULE] Failed to set schedule:", error);
    logError("Failed to set export schedule", error, { userId: req.user?.id });

    return sendError(
      res,
      "INTERNAL_SERVER_ERROR",
      error instanceof Error ? error.message : "Failed to set export schedule",
      500
    );
  }
});

/**
 * GET /api/admin/deals/closed/schedule-export
 * Get scheduled export config for a talent
 * 
 * Query:
 * - talentId: Talent ID to filter (required)
 */
router.get("/closed/schedule-export", async (req: Request, res: Response) => {
  try {
    const { talentId } = req.query;
    const userId = req.user?.id;

    if (!talentId || typeof talentId !== "string") {
      return sendError(res, "VALIDATION_ERROR", "talentId is required", 400);
    }

    if (!userId) {
      return sendError(res, "UNAUTHORIZED", "User not authenticated", 401);
    }

    const talent = await prisma.talent.findUnique({
      where: { id: talentId },
      select: { id: true, userId: true },
    });

    if (!talent) {
      return sendError(res, "NOT_FOUND", "Talent not found", 404);
    }

    if (talent.userId !== userId) {
      return sendError(res, "FORBIDDEN", "You do not have access to this talent", 403);
    }

    const schedule = await getScheduleForTalent(talentId, userId);

    return sendSuccess(res, {
      talentId,
      schedule: schedule || null,
    });
  } catch (error) {
    console.error("[CLOSED_DEALS_SCHEDULE_GET] Failed to fetch schedule:", error);
    return sendError(
      res,
      "INTERNAL_SERVER_ERROR",
      error instanceof Error ? error.message : "Failed to fetch schedule",
      500
    );
  }
});

export default router;
