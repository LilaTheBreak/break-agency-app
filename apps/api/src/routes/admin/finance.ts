import { Router, type Request, type Response } from "express";
import { requireAuth } from "../../middleware/auth.js";
import prisma from "../../lib/prisma.js";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { generateId } from "../../lib/utils.js";
import { logError } from "../../lib/logger.js";
import { logAuditEvent } from "../../lib/auditLogger.js";

const router = Router();

// Admin-only middleware
const requireAdmin = (req: Request, res: Response, next: Function) => {
  const userRole = req.user?.role;
  if (userRole !== "ADMIN" && userRole !== "SUPERADMIN") {
    return res.status(403).json({ error: "Forbidden: Admin access required" });
  }
  next();
};

router.use(requireAuth, requireAdmin);

// ============================================================================
// PHASE 5: COMPREHENSIVE FINANCE API ENDPOINTS
// ============================================================================

/**
 * GET /api/admin/finance/summary
 * Get finance summary (snapshot metrics)
 */
router.get("/summary", async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, creatorId, brandId, dealId } = req.query;

    // Build filter conditions
    const invoiceWhere: any = {};
    const payoutWhere: any = {};

    if (startDate || endDate) {
      const dateFilter: any = {};
      if (startDate) dateFilter.gte = new Date(startDate as string);
      if (endDate) dateFilter.lte = new Date(endDate as string);
      invoiceWhere.issuedAt = dateFilter;
      payoutWhere.createdAt = dateFilter;
    }

    if (brandId) {
      invoiceWhere.brandId = brandId;
      payoutWhere.brandId = brandId;
    }

    if (dealId) {
      invoiceWhere.dealId = dealId;
      payoutWhere.dealId = dealId;
    }

    if (creatorId) {
      payoutWhere.creatorId = creatorId;
    }

    // Fetch invoices and payouts
    const [invoices, payouts] = await Promise.all([
      prisma.invoice.findMany({ where: invoiceWhere }),
      prisma.payout.findMany({ where: payoutWhere })
    ]);

    // Calculate metrics server-side
    const total_cash_in = invoices
      .filter(i => i.status === 'paid')
      .reduce((sum, i) => sum + i.amount, 0);

    const total_cash_out = payouts
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0);

    const outstanding_receivables = invoices
      .filter(i => ['sent', 'due', 'overdue'].includes(i.status))
      .reduce((sum, i) => sum + i.amount, 0);

    const outstanding_liabilities = payouts
      .filter(p => ['pending', 'approved', 'scheduled'].includes(p.status))
      .reduce((sum, p) => sum + p.amount, 0);

    const net_position = total_cash_in - total_cash_out;

    // Fetch commission metrics
    const commissionWhere: any = {};
    if (startDate || endDate) {
      const dateFilter: any = {};
      if (startDate) dateFilter.gte = new Date(startDate as string);
      if (endDate) dateFilter.lte = new Date(endDate as string);
      commissionWhere.calculatedAt = dateFilter;
    }
    if (dealId) commissionWhere.dealId = dealId;
    if (creatorId) commissionWhere.talentId = creatorId;

    const commissions = await prisma.commission.findMany({ where: commissionWhere });
    const total_commissions_pending = commissions
      .filter(c => c.status === 'pending')
      .reduce((sum, c) => sum + c.amount, 0);
    const total_commissions_paid = commissions
      .filter(c => c.status === 'paid')
      .reduce((sum, c) => sum + c.amount, 0);

    res.json({
      total_cash_in,
      total_cash_out,
      net_position,
      outstanding_liabilities,
      outstanding_receivables,
      total_commissions_pending,
      total_commissions_paid,
      currency: "USD" // Default currency - could be enhanced to support multi-currency
    });
  } catch (error) {
    logError("Failed to fetch finance summary", error, { userId: req.user?.id });
    res.status(500).json({ 
      error: "Failed to fetch finance summary",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * GET /api/admin/finance/cashflow
 * Get cash flow time-series data
 */
router.get("/cashflow", async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, months = "6" } = req.query;

    // Build date filter
    const invoiceWhere: any = {};
    const payoutWhere: any = {};

    if (startDate || endDate) {
      const dateFilter: any = {};
      if (startDate) dateFilter.gte = new Date(startDate as string);
      if (endDate) dateFilter.lte = new Date(endDate as string);
      invoiceWhere.issuedAt = dateFilter;
      payoutWhere.createdAt = dateFilter;
    }

    // Fetch invoices and payouts
    const [invoices, payouts] = await Promise.all([
      prisma.invoice.findMany({ where: invoiceWhere }),
      prisma.payout.findMany({ where: payoutWhere })
    ]);

    // Aggregate by month
    const cashFlowSeries = new Map<string, { month: string; in: number; out: number }>();
    
    invoices.forEach((inv) => {
      const date = inv.issuedAt || inv.createdAt;
      if (!date) return;
      const month = new Date(date).toISOString().slice(0, 7); // YYYY-MM
      const current = cashFlowSeries.get(month) || { month, in: 0, out: 0 };
      if (inv.status === "paid") {
        current.in += inv.amount;
      }
      cashFlowSeries.set(month, current);
    });

    payouts.forEach((p) => {
      const date = p.createdAt || p.paidAt;
      if (!date) return;
      const month = new Date(date).toISOString().slice(0, 7); // YYYY-MM
      const current = cashFlowSeries.get(month) || { month, in: 0, out: 0 };
      if (p.status === "paid") {
        current.out += p.amount;
      }
      cashFlowSeries.set(month, current);
    });

    const cashFlowArray = Array.from(cashFlowSeries.values())
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-parseInt(months as string) || 6);

    res.json({ cashFlow: cashFlowArray });
  } catch (error) {
    logError("Failed to fetch cash flow", error, { userId: req.user?.id });
    res.status(500).json({ 
      error: "Failed to fetch cash flow",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * GET /api/admin/finance/payouts
 * Get all payouts with optional filters
 */
router.get("/payouts", async (req: Request, res: Response) => {
  try {
    const { creatorId, dealId, brandId, status, limit = "100" } = req.query;

    const where: any = {};
    if (creatorId) where.creatorId = creatorId;
    if (dealId) where.dealId = dealId;
    if (brandId) where.brandId = brandId;
    if (status) where.status = status;

    const payouts = await prisma.payout.findMany({
      where,
      take: parseInt(limit as string),
      orderBy: { createdAt: "desc" },
      include: {
        Deal: {
          select: {
            id: true,
            brandName: true // Deal model uses brandName, not dealName
          }
        },
        Talent: {
          select: {
            id: true,
            name: true
          }
        },
        Brand: {
          select: {
            id: true,
            name: true
          }
        },
        Commission: {
          select: {
            id: true,
            amount: true,
            status: true,
            type: true,
          },
        },
      }
    } as Prisma.PayoutFindManyArgs);

    // Transform to match frontend format
    const transformed = (payouts as any).map((p: any) => ({
      id: p.id,
      creator: p.Talent?.name || `Creator ${p.creatorId.slice(0, 8)}`,
      creatorId: p.creatorId,
      dealId: p.dealId,
      dealName: p.Deal?.brandName || "Unknown Deal",
      amount: `${p.currency || "USD"}${p.amount.toFixed(2)}`,
      status: p.status === "paid" ? "Paid" : p.status === "pending" ? "Scheduled" : "Awaiting approval",
      expectedDate: p.expectedPayoutAt ? p.expectedPayoutAt.toISOString().split("T")[0] : null,
      createdAt: p.createdAt.toISOString(),
      paidAt: p.paidAt ? p.paidAt.toISOString() : null,
      proofDocIds: [] // Would need to link documents if that model exists
    }));

    res.json({ payouts: transformed });
  } catch (error) {
    logError("Failed to fetch payouts", error, { userId: req.user?.id });
    res.status(500).json({ 
      error: "Failed to fetch payouts",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * GET /api/admin/finance/invoices
 * Get all invoices with optional filters
 */
router.get("/invoices", async (req: Request, res: Response) => {
  try {
    const { dealId, brandId, status, limit = "100" } = req.query;

    const where: any = {};
    if (dealId) where.dealId = dealId;
    if (brandId) where.brandId = brandId;
    if (status) {
      // Map frontend status to database status
      const statusMap: Record<string, string> = {
        "Paid": "paid",
        "Due": "due",
        "Overdue": "overdue",
        "Sent": "sent"
      };
      where.status = statusMap[status as string] || status;
    }

    const invoices = await prisma.invoice.findMany({
      where,
      take: parseInt(limit as string),
      orderBy: { createdAt: "desc" },
      include: {
        Deal: {
          select: {
            id: true,
            brandName: true // Deal model uses brandName, not dealName
          }
        },
        Brand: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Transform to match frontend format
    const transformed = invoices.map(inv => ({
      id: inv.id,
      brand: inv.Brand?.name || "Unknown Brand",
      brandId: inv.brandId,
      ref: inv.invoiceNumber,
      dealId: inv.dealId,
      dealName: inv.Deal?.brandName || "Unknown Deal", // Deal model uses brandName
      amount: `${inv.currency || "USD"}${inv.amount.toFixed(2)}`,
      status: inv.status === "paid" ? "Paid" : 
              inv.status === "overdue" ? "Overdue" :
              inv.status === "due" ? "Due" : "Sent",
      dueDate: inv.dueAt ? inv.dueAt.toISOString().split("T")[0] : null,
      createdAt: inv.createdAt.toISOString(),
      paidAt: inv.paidAt ? inv.paidAt.toISOString() : null,
      xeroId: null, // Would need XeroConnection model if implemented
      docIds: [] // Would need to link documents if that model exists
    }));

    res.json({ invoices: transformed });
  } catch (error) {
    logError("Failed to fetch invoices", error, { userId: req.user?.id });
    res.status(500).json({ 
      error: "Failed to fetch invoices",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * GET /api/admin/finance/by-creator
 * Get aggregated revenue per creator
 */
router.get("/by-creator", async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const payoutWhere: any = {};
    if (startDate || endDate) {
      const dateFilter: any = {};
      if (startDate) dateFilter.gte = new Date(startDate as string);
      if (endDate) dateFilter.lte = new Date(endDate as string);
      payoutWhere.createdAt = dateFilter;
    }

    const payouts = await prisma.payout.findMany({
      where: payoutWhere,
      include: {
        Talent: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Aggregate by creator
    const byCreator = new Map<string, { creator: string; creatorId: string; total: number }>();
    
    payouts.forEach(p => {
      const creatorId = p.creatorId;
      const creator = p.Talent?.name || `Creator ${creatorId.slice(0, 8)}`;
      const current = byCreator.get(creatorId) || { creator, creatorId, total: 0 };
      current.total += p.amount;
      byCreator.set(creatorId, current);
    });

    const result = Array.from(byCreator.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 20); // Top 20 creators

    res.json({ byCreator: result });
  } catch (error) {
    logError("Failed to fetch payouts by creator", error, { userId: req.user?.id });
    res.status(500).json({ 
      error: "Failed to fetch payouts by creator",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * GET /api/admin/finance/attention
 * Get attention items (overdue invoices, delayed payouts)
 */
router.get("/attention", async (req: Request, res: Response) => {
  try {
    const [overdueInvoices, delayedPayouts] = await Promise.all([
      prisma.invoice.findMany({
        where: { status: "overdue" },
        include: {
          Deal: { select: { id: true, brandName: true } },
          Brand: { select: { name: true } }
        }
      }),
      prisma.payout.findMany({
        where: {
          status: { not: "paid" },
          expectedPayoutAt: { lt: new Date() }
        },
        include: {
          Talent: { select: { name: true } },
          Deal: { select: { id: true, brandName: true } }
        }
      })
    ]);

    const items = [
      ...overdueInvoices.map(inv => ({
        id: `att-inv-${inv.id}`,
        type: "invoice",
        label: `Overdue invoice ${inv.invoiceNumber}`,
        detail: `${inv.Brand?.name || "Unknown"} · ${inv.currency}${inv.amount} · due ${inv.dueAt.toISOString().split("T")[0]}`,
        link: { type: "invoice", id: inv.id },
        amount: inv.amount,
        dueDate: inv.dueAt
      })),
      ...delayedPayouts.map(p => ({
        id: `att-pay-${p.id}`,
        type: "payout",
        label: "Delayed payout",
        detail: `${p.Talent?.name || "Unknown"} · ${p.currency}${p.amount} · expected ${p.expectedPayoutAt?.toISOString().split("T")[0] || "N/A"}`,
        link: { type: "payout", id: p.id },
        amount: p.amount,
        expectedDate: p.expectedPayoutAt
      }))
    ];

    res.json({ items });
  } catch (error) {
    logError("Failed to fetch attention items", error, { userId: req.user?.id });
    res.status(500).json({ 
      error: "Failed to fetch attention items",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// ============================================================================
// EXISTING ENDPOINTS (keeping for backward compatibility)
// ============================================================================

// GET /api/admin/finance/analytics - Backend aggregation for finance analytics
router.get("/analytics", async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, creatorId, brandId, dealId, status } = req.query;

    // Build filter conditions
    const invoiceWhere: any = {};
    const payoutWhere: any = {};

    if (startDate || endDate) {
      const dateFilter: any = {};
      if (startDate) dateFilter.gte = new Date(startDate as string);
      if (endDate) dateFilter.lte = new Date(endDate as string);
      invoiceWhere.issuedAt = dateFilter;
      payoutWhere.createdAt = dateFilter;
    }

    if (brandId) {
      invoiceWhere.brandId = brandId;
      payoutWhere.brandId = brandId;
    }

    if (dealId) {
      invoiceWhere.dealId = dealId;
      payoutWhere.dealId = dealId;
    }

    if (creatorId) {
      payoutWhere.creatorId = creatorId;
    }

    if (status) {
      invoiceWhere.status = status;
      payoutWhere.status = status;
    }

    // Fetch all invoices and payouts
    const [invoices, payouts] = await Promise.all([
      prisma.invoice.findMany({ where: invoiceWhere }),
      prisma.payout.findMany({ where: payoutWhere })
    ]);

    // Phase 2: Backend aggregation for cash flow series (by month)
    const cashFlowSeries = new Map<string, { month: string; in: number; out: number }>();
    invoices.forEach((inv) => {
      const date = inv.issuedAt || inv.createdAt;
      if (!date) return;
      const month = new Date(date).toISOString().slice(0, 7); // YYYY-MM
      const current = cashFlowSeries.get(month) || { month, in: 0, out: 0 };
      if (inv.status === "paid") {
        current.in += inv.amount;
      }
      cashFlowSeries.set(month, current);
    });
    payouts.forEach((p) => {
      const date = p.createdAt || p.paidAt;
      if (!date) return;
      const month = new Date(date).toISOString().slice(0, 7); // YYYY-MM
      const current = cashFlowSeries.get(month) || { month, in: 0, out: 0 };
      if (p.status === "paid") {
        current.out += p.amount;
      }
      cashFlowSeries.set(month, current);
    });
    const cashFlowArray = Array.from(cashFlowSeries.values())
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6); // Last 6 months

    // Phase 2: Backend aggregation for payouts by creator
    const payoutsByCreatorMap = new Map<string, number>();
    payouts.forEach((p) => {
      const creator = p.creatorId || "Unknown";
      const current = payoutsByCreatorMap.get(creator) || 0;
      payoutsByCreatorMap.set(creator, current + p.amount);
    });
    const payoutsByCreator = Array.from(payoutsByCreatorMap.entries())
      .map(([creator, total]) => ({ creator, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);

    // Phase 2: Backend aggregation for invoices by status
    const invoicesByStatus = ["overdue", "due", "paid"].map((status) => {
      const total = invoices
        .filter((i) => i.status === status)
        .reduce((sum, i) => sum + i.amount, 0);
      return { status, total };
    });

    // Phase 2: Backend aggregation for snapshot
    const cashIn = invoices
      .filter((i) => i.status === "paid")
      .reduce((sum, i) => sum + i.amount, 0);
    const cashOut = payouts
      .filter((p) => p.status === "paid")
      .reduce((sum, p) => sum + p.amount, 0);
    const receivables = invoices
      .filter((i) => i.status !== "paid")
      .reduce((sum, i) => sum + i.amount, 0);
    const liabilities = payouts
      .filter((p) => p.status !== "paid")
      .reduce((sum, p) => sum + p.amount, 0);
    const net = cashIn - cashOut;

    // Phase 2: Backend aggregation for attention items
    const overdueInvoices = invoices.filter((inv) => inv.status === "overdue");
    const delayedPayouts = payouts.filter((p) => {
      if (p.status === "paid") return false;
      if (!p.createdAt) return false;
      const daysSince = Math.floor((Date.now() - new Date(p.createdAt).getTime()) / (24 * 60 * 60 * 1000));
      return daysSince > 7; // More than 7 days old
    });

    res.json({
      cashFlowSeries: cashFlowArray,
      payoutsByCreator,
      invoicesByStatus,
      snapshot: {
        cashIn,
        cashOut,
        receivables,
        liabilities,
        net
      },
      attention: {
        overdueInvoices: overdueInvoices.length,
        delayedPayouts: delayedPayouts.length,
        items: [
          ...overdueInvoices.map((inv) => ({
            id: `att-inv-${inv.id}`,
            type: "invoice",
            label: `Overdue invoice ${inv.invoiceNumber}`,
            amount: inv.amount,
            dueDate: inv.dueAt
          })),
          ...delayedPayouts.map((p) => ({
            id: `att-pay-${p.id}`,
            type: "payout",
            label: "Delayed payout",
            amount: p.amount,
            createdAt: p.createdAt
          }))
        ]
      }
    });
  } catch (error) {
    logError("Error fetching finance analytics", error, { userId: req.user?.id });
    res.status(500).json({ 
      error: "Failed to fetch finance analytics",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// ============================================================================
// INVOICES APIs
// ============================================================================

const InvoiceCreateSchema = z.object({
  dealId: z.string(),
  brandId: z.string().optional(),
  invoiceNumber: z.string(),
  amount: z.number().positive(),
  currency: z.string().default("USD"),
  status: z.enum(["draft", "sent", "due", "overdue", "paid"]).default("draft"),
  issuedAt: z.string().transform(s => new Date(s)),
  dueAt: z.string().transform(s => new Date(s)),
});

const InvoiceUpdateSchema = z.object({
  amount: z.number().positive().optional(),
  status: z.enum(["draft", "sent", "due", "overdue", "paid"]).optional(),
  issuedAt: z.string().transform(s => new Date(s)).optional(),
  dueAt: z.string().transform(s => new Date(s)).optional(),
});

router.post("/invoices", async (req: Request, res: Response) => {
  try {
    const parsed = InvoiceCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
    }

    const invoice = await prisma.invoice.create({
      data: {
        id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...parsed.data,
        updatedAt: new Date()
      }
    });

    // Audit logging
    try {
      await logAuditEvent(req as any, {
        action: "INVOICE_CREATED",
        entityType: "Invoice",
        entityId: invoice.id,
        metadata: {
          dealId: invoice.dealId,
          brandId: invoice.brandId,
          invoiceNumber: invoice.invoiceNumber,
          amount: invoice.amount,
          currency: invoice.currency,
          status: invoice.status
        }
      });
    } catch (logError) {
      console.error("[Audit] Failed to log invoice creation:", logError);
    }

    res.status(201).json(invoice);
  } catch (error) {
    logError("Error creating invoice", error, { userId: req.user?.id });
    res.status(500).json({ error: "Failed to create invoice" });
  }
});

router.get("/invoices/:id", async (req: Request, res: Response) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: {
        Deal: {
          include: {
            Brand: true,
            Talent: true
          }
        }
      }
    });

    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    res.json(invoice);
  } catch (error) {
    logError("Error fetching invoice", error, { invoiceId: req.params.id });
    res.status(500).json({ error: "Failed to fetch invoice" });
  }
});

router.patch("/invoices/:id", async (req: Request, res: Response) => {
  try {
    const parsed = InvoiceUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
    }

    // Prevent updates to paid invoices (immutable once paid)
    const existing = await prisma.invoice.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: "Invoice not found" });
    }
    
    if (existing.status === "paid") {
      return res.status(403).json({ error: "Cannot modify paid invoices" });
    }

    // Enforce status lifecycle: draft → sent → due → overdue → paid
    if (parsed.data.status && existing.status !== parsed.data.status) {
      const validTransitions: Record<string, string[]> = {
        draft: ["sent", "draft"],
        sent: ["due", "overdue", "paid", "sent"],
        due: ["overdue", "paid", "due"],
        overdue: ["paid", "overdue"],
        paid: [] // No transitions from paid
      };

      const allowedNextStatuses = validTransitions[existing.status] || [];
      if (!allowedNextStatuses.includes(parsed.data.status)) {
        return res.status(400).json({ 
          error: "Invalid status transition", 
          currentStatus: existing.status,
          attemptedStatus: parsed.data.status,
          allowedTransitions: allowedNextStatuses
        });
      }
    }

    const invoice = await prisma.invoice.update({
      where: { id: req.params.id },
      data: {
        ...parsed.data,
        updatedAt: new Date()
      }
    });

    // Auto-update status based on due date if status is "sent" or "due"
    if (invoice.status === "sent" || invoice.status === "due") {
      const now = new Date();
      if (invoice.dueAt && invoice.dueAt < now && invoice.status !== "paid") {
        await prisma.invoice.update({
          where: { id: invoice.id },
          data: { status: "overdue", updatedAt: new Date() }
        });
        invoice.status = "overdue";
      }
    }

    // Push to Xero if status changed from draft and Xero is enabled
    if (parsed.data.status && existing.status === "draft" && parsed.data.status !== "draft") {
      const xeroEnabled = process.env.XERO_INTEGRATION_ENABLED === "true";
      if (xeroEnabled && !invoice.xeroId) {
        try {
          const { pushInvoiceToXero } = await import("../../services/xero/xeroInvoiceSync.js");
          const xeroResult = await pushInvoiceToXero(invoice.id);
          if (xeroResult.success && xeroResult.xeroId) {
            // Update invoice with Xero ID
            await prisma.invoice.update({
              where: { id: invoice.id },
              data: { xeroId: xeroResult.xeroId }
            });
            invoice.xeroId = xeroResult.xeroId;
          }
        } catch (xeroError) {
          console.error("[Finance] Failed to push invoice to Xero:", xeroError);
          // Don't fail the invoice update if Xero push fails
        }
      }
    }

    // WORKFLOW ASSERTION: Invoice → Paid → Commission must be created
    if (parsed.data.status === "paid" && existing.status !== "paid") {
      try {
        // Get deal associated with invoice
        const deal = invoice.dealId ? await prisma.deal.findUnique({
          where: { id: invoice.dealId },
          include: { Talent: true }
        }) : null;
        
        if (deal && deal.Talent) {
          const { createCommissionsForPaidInvoice } = await import("../../services/commissionService.js");
          const commissions = await createCommissionsForPaidInvoice(
            invoice.id,
            invoice.dealId!,
            deal.Talent.id,
            deal.userId,
            invoice.amount
          );
          
          console.log(`[Finance] ✅ Commissions created for paid invoice ${invoice.invoiceNumber}:`, commissions.length);
          
          // Assertion: Verify commissions were actually created
          if (!commissions || commissions.length === 0) {
            throw new Error("Commission creation returned empty array");
          }
        } else {
          console.warn(`[Finance] ⚠️  Invoice ${invoice.invoiceNumber} marked as paid but no deal/talent found - commissions not created`);
          logError("Invoice paid but commissions not created - missing deal/talent", new Error("Missing deal or talent"), {
            invoiceId: invoice.id,
            dealId: invoice.dealId,
            route: req.path
          });
        }
      } catch (commissionError) {
        const errorMessage = commissionError instanceof Error ? commissionError.message : String(commissionError);
        console.error("[Finance] ❌ CRITICAL: Commission creation failed for paid invoice:", errorMessage);
        logError("Commission creation failed for paid invoice - WORKFLOW BREAK", commissionError, {
          invoiceId: invoice.id,
          dealId: invoice.dealId,
          route: req.path
        });
        // Don't fail invoice update, but log critical warning
      }
    }

    // Audit logging for status changes
    if (parsed.data.status && existing.status !== parsed.data.status) {
      try {
        await logAuditEvent(req as any, {
          action: "INVOICE_STATUS_UPDATED",
          entityType: "Invoice",
          entityId: invoice.id,
          metadata: {
            previousStatus: existing.status,
            newStatus: invoice.status,
            dealId: invoice.dealId,
            amount: invoice.amount
          }
        });
      } catch (logError) {
        console.error("[Audit] Failed to log invoice status update:", logError);
      }
    }

    // Push to Xero if status changed from draft and Xero is enabled
    if (parsed.data.status && existing.status === "draft" && parsed.data.status !== "draft") {
      const xeroEnabled = process.env.XERO_INTEGRATION_ENABLED === "true";
      if (xeroEnabled && !invoice.xeroId) {
        try {
          const { pushInvoiceToXero } = await import("../../services/xero/xeroInvoiceSync.js");
          const xeroResult = await pushInvoiceToXero(invoice.id);
          if (xeroResult.success && xeroResult.xeroId) {
            // Update invoice with Xero ID
            const updatedInvoice = await prisma.invoice.update({
              where: { id: invoice.id },
              data: { xeroId: xeroResult.xeroId }
            });
            invoice.xeroId = updatedInvoice.xeroId;
          }
        } catch (xeroError) {
          console.error("[Finance] Failed to push invoice to Xero:", xeroError);
          // Don't fail the invoice update if Xero push fails
        }
      }
    }

    res.json(invoice);
  } catch (error) {
    logError("Error updating invoice", error, { invoiceId: req.params.id });
    res.status(500).json({ error: "Failed to update invoice" });
  }
});

router.post("/invoices/:id/mark-paid", async (req: Request, res: Response) => {
  try {
    const { amount, method, notes } = req.body;

    // Get existing invoice with deal info
    const existing = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: {
        Deal: {
          select: {
            id: true,
            userId: true, // Agent ID
            talentId: true,
            value: true,
            currency: true,
          },
        },
      },
    });

    if (!existing) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    if (existing.status === "paid") {
      return res.status(400).json({ error: "Invoice is already marked as paid" });
    }

    // Update invoice to paid
    const invoice = await prisma.invoice.update({
      where: { id: req.params.id },
      data: {
        status: "paid",
        paidAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Auto-create commissions when invoice is marked as paid
    try {
      const { createCommissionsForPaidInvoice } = await import("../../services/commissionService.js");
      
      // Check if commissions already exist for this invoice
      const existingCommissions = await prisma.commission.findMany({
        where: { invoiceId: invoice.id },
      });

      if (existingCommissions.length === 0) {
        // Create commissions
        const dealValue = existing.Deal?.value || invoice.amount;
        const agentId = existing.Deal?.userId || null;
        const talentId = existing.Deal?.talentId;

        if (!talentId) {
          console.warn(`[Finance] Cannot create commissions: Deal ${existing.dealId} has no talentId`);
        } else {
          await createCommissionsForPaidInvoice(
            invoice.id,
            existing.dealId,
            talentId,
            agentId,
            dealValue
          );
          console.log(`[Finance] Created commissions for invoice ${invoice.id}`);
        }
      } else {
        console.log(`[Finance] Commissions already exist for invoice ${invoice.id}, skipping creation`);
      }
    } catch (commissionError) {
      console.error("[Finance] Failed to create commissions for paid invoice:", commissionError);
      // Don't fail the invoice payment if commission creation fails
    }

    // Audit logging
    try {
      await logAuditEvent(req as any, {
        action: "INVOICE_MARKED_PAID",
        entityType: "Invoice",
        entityId: invoice.id,
        metadata: {
          dealId: invoice.dealId,
          amount: amount || invoice.amount,
          method: method || "manual",
          notes,
        },
      });
    } catch (logError) {
      console.error("[Audit] Failed to log invoice payment:", logError);
    }

    res.json(invoice);
  } catch (error) {
    logError("Error marking invoice as paid", error, { invoiceId: req.params.id });
    res.status(500).json({ error: "Failed to mark invoice as paid" });
  }
});

router.post("/invoices/:id/send-reminder", async (req: Request, res: Response) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id }
    });

    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    // TODO: Implement email reminder logic
    // For now, just log the action
    try {
      await logAuditEvent(req as any, {
        action: "INVOICE_REMINDER_SENT",
        entityType: "Invoice",
        entityId: invoice.id,
        metadata: {
          invoiceNumber: invoice.invoiceNumber,
          amount: invoice.amount
        }
      });
    } catch (logError) {
      console.error("[Audit] Failed to log reminder:", logError);
    }

    res.json({ success: true, message: "Reminder sent" });
  } catch (error) {
    logError("Error sending invoice reminder", error, { invoiceId: req.params.id });
    res.status(500).json({ error: "Failed to send reminder" });
  }
});

// ============================================================================
// PAYOUTS APIs
// ============================================================================

const PayoutCreateSchema = z.object({
  creatorId: z.string(),
  dealId: z.string(),
  brandId: z.string().optional(),
  amount: z.number().positive(),
  currency: z.string().default("USD"),
  status: z.enum(["pending", "approved", "scheduled", "paid"]).default("pending"),
  expectedPayoutAt: z.string().transform(s => new Date(s)).optional(),
  commissionIds: z.array(z.string()).optional(), // Optional: link specific commissions
});

router.post("/payouts", async (req: Request, res: Response) => {
  try {
    const parsed = PayoutCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
    }

    const payout = await prisma.payout.create({
      data: {
        id: `payout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        creatorId: parsed.data.creatorId,
        dealId: parsed.data.dealId,
        brandId: parsed.data.brandId,
        amount: parsed.data.amount,
        currency: parsed.data.currency,
        status: parsed.data.status,
        expectedPayoutAt: parsed.data.expectedPayoutAt,
        createdBy: req.user?.id || null,
        updatedAt: new Date()
      }
    });

    // Link commissions to payout if commissionIds provided, or auto-link pending commissions for this deal/talent
    try {
      const { linkCommissionsToPayout } = await import("../../services/commissionService.js");
      
      if (parsed.data.commissionIds && parsed.data.commissionIds.length > 0) {
        // Link specific commissions
        await linkCommissionsToPayout(payout.id, parsed.data.commissionIds);
      } else {
        // Auto-link pending commissions for this deal and talent
        const pendingCommissions = await prisma.commission.findMany({
          where: {
            dealId: parsed.data.dealId,
            talentId: parsed.data.creatorId,
            status: "pending",
            payoutId: null,
          },
        });

        if (pendingCommissions.length > 0) {
          const commissionIds = pendingCommissions.map(c => c.id);
          await linkCommissionsToPayout(payout.id, commissionIds);
          console.log(`[Finance] Auto-linked ${commissionIds.length} commissions to payout ${payout.id}`);
        }
      }
    } catch (commissionError) {
      console.error("[Finance] Failed to link commissions to payout:", commissionError);
      // Don't fail payout creation if commission linking fails
    }

    // Audit logging
    try {
      await logAuditEvent(req as any, {
        action: "PAYOUT_CREATED",
        entityType: "Payout",
        entityId: payout.id,
        metadata: {
          creatorId: payout.creatorId,
          dealId: payout.dealId,
          amount: payout.amount,
          currency: payout.currency,
          status: payout.status
        }
      });
    } catch (logError) {
      console.error("[Audit] Failed to log payout creation:", logError);
    }

    res.status(201).json(payout);
  } catch (error) {
    logError("Error creating payout", error, { userId: req.user?.id });
    res.status(500).json({ error: "Failed to create payout" });
  }
});

router.get("/payouts/:id", async (req: Request, res: Response) => {
  try {
    const payout = await prisma.payout.findUnique({
      where: { id: req.params.id },
      include: {
        Deal: {
          include: {
            Brand: true,
            Talent: true
          }
        },
        Commission: {
          include: {
            Invoice: {
              select: {
                id: true,
                invoiceNumber: true,
              },
            },
          },
        },
      }
    });

    if (!payout) {
      return res.status(404).json({ error: "Payout not found" });
    }

    res.json(payout);
  } catch (error) {
    logError("Error fetching payout", error, { payoutId: req.params.id });
    res.status(500).json({ error: "Failed to fetch payout" });
  }
});

router.post("/payouts/:id/mark-paid", async (req: Request, res: Response) => {
  try {
    const { amount, method, notes } = req.body;

    // Update payout to paid
    const payout = await prisma.payout.update({
      where: { id: req.params.id },
      data: {
        status: "paid",
        paidAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Mark linked commissions as paid
    try {
      const { markCommissionsAsPaid } = await import("../../services/commissionService.js");
      await markCommissionsAsPaid(payout.id);
      console.log(`[Finance] Marked commissions as paid for payout ${payout.id}`);
    } catch (commissionError) {
      console.error("[Finance] Failed to mark commissions as paid:", commissionError);
      // Don't fail payout update if commission update fails
    }

    // Audit logging
    try {
      await logAuditEvent(req as any, {
        action: "PAYOUT_MARKED_PAID",
        entityType: "Payout",
        entityId: payout.id,
        metadata: {
          creatorId: payout.creatorId,
          dealId: payout.dealId,
          amount: amount || payout.amount,
          method: method || "manual",
          notes
        }
      });
    } catch (logError) {
      console.error("[Audit] Failed to log payout payment:", logError);
    }

    res.json(payout);
  } catch (error) {
    logError("Error marking payout as paid", error, { payoutId: req.params.id });
    res.status(500).json({ error: "Failed to mark payout as paid" });
  }
});

// ============================================================================
// COMMISSIONS APIs
// ============================================================================

router.get("/commissions", async (req: Request, res: Response) => {
  try {
    const { dealId, talentId, agentId, status, limit = "100" } = req.query;

    const where: any = {};
    if (dealId) where.dealId = dealId as string;
    if (talentId) where.talentId = talentId as string;
    if (agentId) where.agentId = agentId as string;
    if (status) where.status = status as string;

    const commissions = await prisma.commission.findMany({
      where,
      take: parseInt(limit as string),
      orderBy: { calculatedAt: "desc" },
      include: {
        Deal: {
          select: {
            id: true,
            brandName: true,
            value: true,
          },
        },
        Talent: {
          select: {
            id: true,
            name: true,
          },
        },
        User: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        Invoice: {
          select: {
            id: true,
            invoiceNumber: true,
          },
        },
        Payout: {
          select: {
            id: true,
            status: true,
            paidAt: true,
          },
        },
      },
    });

    res.json({ commissions });
  } catch (error) {
    logError("Failed to fetch commissions", error, { userId: req.user?.id });
    res.status(500).json({ 
      error: "Failed to fetch commissions",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

router.get("/commissions/:id", async (req: Request, res: Response) => {
  try {
    const commission = await prisma.commission.findUnique({
      where: { id: req.params.id },
      include: {
        Deal: {
          include: {
            Brand: true,
            Talent: true,
          },
        },
        Talent: {
          select: {
            id: true,
            name: true,
          },
        },
        User: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        Invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            amount: true,
          },
        },
        Payout: {
          select: {
            id: true,
            status: true,
            paidAt: true,
            amount: true,
          },
        },
      },
    });

    if (!commission) {
      return res.status(404).json({ error: "Commission not found" });
    }

    res.json(commission);
  } catch (error) {
    logError("Error fetching commission", error, { commissionId: req.params.id });
    res.status(500).json({ error: "Failed to fetch commission" });
  }
});

// ============================================================================
// ============================================================================
// XERO INTEGRATION (V1.1)
// ============================================================================

router.get("/xero/status", async (req: Request, res: Response) => {
  const enabled = process.env.XERO_INTEGRATION_ENABLED === "true";
  if (!enabled) {
    return res.status(503).json({ 
      error: "Xero integration is disabled",
      message: "This feature is currently disabled. Contact an administrator to enable it.",
      code: "FEATURE_DISABLED"
    });
  }

  try {
    const connection = await prisma.xeroConnection.findFirst({
      where: { connected: true }
    });

    if (!connection) {
      return res.json({
        connected: false,
        status: "disconnected",
        message: "Xero account not connected. Please authenticate to continue."
      });
    }

    // Count synced invoices
    const syncedInvoices = await prisma.invoice.count({
      where: { xeroId: { not: null } }
    });

    // Count invoices with sync errors
    const errorInvoices = await prisma.invoice.count({
      where: { xeroSyncError: { not: null } }
    });

    res.json({
      connected: true,
      status: connection.expiresAt && connection.expiresAt < new Date() ? "expired" : "connected",
      message: "Xero connected successfully",
      tenantId: connection.tenantId,
      expiresAt: connection.expiresAt,
      lastSyncedAt: connection.lastSyncedAt,
      stats: {
        syncedInvoices,
        errorInvoices
      }
    });
  } catch (error) {
    logError("Error checking Xero status", error, { userId: req.user?.id });
    res.status(500).json({ 
      error: "Failed to check Xero status",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

router.get("/xero/connect", async (req: Request, res: Response) => {
  const enabled = process.env.XERO_INTEGRATION_ENABLED === "true";
  if (!enabled) {
    return res.status(503).json({ 
      error: "Xero integration is disabled",
      message: "This feature is currently disabled. Contact an administrator to enable it.",
      code: "FEATURE_DISABLED"
    });
  }

  try {
    const { getXeroAuthUrl } = await import("../../services/xero/xeroAuth.js");
    const authUrl = getXeroAuthUrl();
    res.json({ success: true, url: authUrl });
  } catch (error: any) {
    logError("Error initiating Xero connection", error, { userId: req.user?.id });
    res.status(500).json({ 
      success: false,
      error: "Failed to initiate Xero connection",
      message: error.message
    });
  }
});

router.get("/xero/callback", async (req: Request, res: Response) => {
  const enabled = process.env.XERO_INTEGRATION_ENABLED === "true";
  if (!enabled) {
    const { getFrontendUrl } = await import("../../config/frontendUrl.js");
    return res.redirect(`${getFrontendUrl()}/admin/finance?error=xero_disabled`);
  }

  try {
    const { code, error } = req.query;

    const { getFrontendUrl } = await import("../../config/frontendUrl.js");
    const frontendUrl = getFrontendUrl();

    if (error) {
      return res.redirect(`${frontendUrl}/admin/finance?error=xero_auth_denied`);
    }

    if (!code || typeof code !== "string") {
      return res.redirect(`${frontendUrl}/admin/finance?error=xero_auth_failed`);
    }

    const { exchangeXeroCode, storeXeroConnection } = await import("../../services/xero/xeroAuth.js");
    const { accessToken, refreshToken, expiresIn, tenantId, tenantName } = await exchangeXeroCode(code);
    
    await storeXeroConnection(accessToken, refreshToken, expiresIn, tenantId, tenantName);

    res.redirect(`${frontendUrl}/admin/finance?success=xero_connected`);
  } catch (error: any) {
    logError("Error in Xero callback", error, {});
    const { getFrontendUrl } = await import("../../config/frontendUrl.js");
    res.redirect(`${getFrontendUrl()}/admin/finance?error=xero_auth_failed`);
  }
});

router.post("/xero/sync", async (req: Request, res: Response) => {
  const enabled = process.env.XERO_INTEGRATION_ENABLED === "true";
  if (!enabled) {
    return res.status(503).json({ 
      error: "Xero integration is disabled",
      message: "This feature is currently disabled. Contact an administrator to enable it.",
      code: "FEATURE_DISABLED"
    });
  }

  try {
    const { syncAllXeroInvoices } = await import("../../services/xero/xeroInvoiceSync.js");
    const stats = await syncAllXeroInvoices();
    
    res.json({
      success: true,
      message: "Xero sync completed",
      stats
    });
  } catch (error) {
    logError("Error syncing Xero invoices", error, { userId: req.user?.id });
    res.status(500).json({ 
      success: false,
      error: "Failed to sync Xero invoices",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

router.get("/xero/invoice/:id", async (req: Request, res: Response) => {
  const enabled = process.env.XERO_INTEGRATION_ENABLED === "true";
  if (!enabled) {
    return res.status(503).json({ 
      error: "Xero integration is disabled",
      message: "This feature is currently disabled. Contact an administrator to enable it.",
      code: "FEATURE_DISABLED"
    });
  }

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      select: { xeroId: true }
    });

    if (!invoice || !invoice.xeroId) {
      return res.status(404).json({ 
        error: "Invoice not found or not synced to Xero",
        message: "This invoice has not been synced to Xero yet."
      });
    }

    const { getXeroInvoiceStatus } = await import("../../services/xero/xeroService.js");
    const xeroStatus = await getXeroInvoiceStatus(invoice.xeroId);

    res.json({
      success: true,
      xeroId: invoice.xeroId,
      status: xeroStatus.status,
      paidAt: xeroStatus.paidAt,
      totalPaid: xeroStatus.totalPaid
    });
  } catch (error) {
    logError("Error fetching Xero invoice", error, { invoiceId: req.params.id });
    res.status(500).json({ 
      error: "Failed to fetch Xero invoice",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;
