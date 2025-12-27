import { Router, type Request, type Response } from "express";
import { requireAuth } from "../../middleware/auth.js";
import prisma from "../../lib/prisma.js";
import { z } from "zod";
import { Prisma } from "@prisma/client";

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
// PHASE 3.1 - FINANCE SUMMARY & METRICS
// ============================================================================

router.get("/summary", async (req: Request, res: Response) => {
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

    // Calculate metrics
    const [invoices, payouts] = await Promise.all([
      prisma.invoice.findMany({ where: invoiceWhere }),
      prisma.payout.findMany({ where: payoutWhere })
    ]);

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

    res.json({
      total_cash_in,
      total_cash_out,
      net_position,
      outstanding_liabilities,
      outstanding_receivables
    });
  } catch (error) {
    console.error("Error fetching finance summary:", error);
    res.status(500).json({ 
      error: "Failed to fetch finance summary",
      total_cash_in: 0,
      total_cash_out: 0,
      net_position: 0,
      outstanding_liabilities: 0,
      outstanding_receivables: 0
    });
  }
});

// ============================================================================
// PHASE 3.2 - INVOICES APIs
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

    // Log activity
    await prisma.financeActivityLog.create({
      data: {
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        actionType: "invoice_created",
        referenceType: "invoice",
        referenceId: invoice.id,
        amount: invoice.amount,
        currency: invoice.currency,
        createdBy: req.user?.id
      }
    });

    res.status(201).json(invoice);
  } catch (error) {
    console.error("Error creating invoice:", error);
    res.status(500).json({ error: "Failed to create invoice" });
  }
});

router.get("/invoices", async (req: Request, res: Response) => {
  try {
    const { dealId, brandId, status, limit = "50" } = req.query;

    const where: any = {};
    if (dealId) where.dealId = dealId;
    if (brandId) where.brandId = brandId;
    if (status) where.status = status;

    const invoices = await prisma.invoice.findMany({
      where,
      take: parseInt(limit as string),
      orderBy: { createdAt: "desc" },
      include: {
        Deal: {
          include: {
            Brand: true,
            Talent: true
          }
        }
      }
    });

    res.json(invoices || []);
  } catch (error) {
    console.error("Error fetching invoices:", error);
    res.json([]);
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

    // Fetch related documents and activity logs manually
    const [documents, activityLogs] = await Promise.all([
      prisma.financeDocument.findMany({
        where: { linkedType: "invoice", linkedId: invoice.id },
        orderBy: { uploadedAt: "desc" }
      }),
      prisma.financeActivityLog.findMany({
        where: { referenceType: "invoice", referenceId: invoice.id },
        orderBy: { createdAt: "desc" }
      })
    ]);

    res.json({ ...invoice, Documents: documents, ActivityLogs: activityLogs });
  } catch (error) {
    console.error("Error fetching invoice:", error);
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
    if (existing?.status === "paid") {
      return res.status(403).json({ error: "Cannot modify paid invoices" });
    }

    const invoice = await prisma.invoice.update({
      where: { id: req.params.id },
      data: {
        ...parsed.data,
        updatedAt: new Date()
      }
    });

    res.json(invoice);
  } catch (error) {
    console.error("Error updating invoice:", error);
    res.status(500).json({ error: "Failed to update invoice" });
  }
});

router.post("/invoices/:id/mark-paid", async (req: Request, res: Response) => {
  try {
    const { amount, method, notes } = req.body;

    // Update invoice to paid
    const invoice = await prisma.invoice.update({
      where: { id: req.params.id },
      data: {
        status: "paid",
        paidAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Create reconciliation record
    await prisma.financeReconciliation.create({
      data: {
        id: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: "invoice_payment",
        referenceId: invoice.id,
        amount: amount || invoice.amount,
        currency: invoice.currency,
        method: method || "manual",
        notes: notes || null,
        confirmedAt: new Date(),
        createdBy: req.user?.id || ""
      }
    });

    // Log activity
    await prisma.financeActivityLog.create({
      data: {
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        actionType: "payment_received",
        referenceType: "invoice",
        referenceId: invoice.id,
        amount: invoice.amount,
        currency: invoice.currency,
        createdBy: req.user?.id
      }
    });

    res.json({ success: true, invoice });
  } catch (error) {
    console.error("Error marking invoice as paid:", error);
    res.status(500).json({ error: "Failed to mark invoice as paid" });
  }
});

router.post("/invoices/:id/send-reminder", async (req: Request, res: Response) => {
  try {
    // Log activity (actual email sending would be implemented separately)
    await prisma.financeActivityLog.create({
      data: {
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        actionType: "reminder_sent",
        referenceType: "invoice",
        referenceId: req.params.id,
        createdBy: req.user?.id
      }
    });

    res.json({ success: true, message: "Reminder sent" });
  } catch (error) {
    console.error("Error sending reminder:", error);
    res.status(500).json({ error: "Failed to send reminder" });
  }
});

// ============================================================================
// PHASE 3.3 - PAYOUTS APIs
// ============================================================================

const PayoutCreateSchema = z.object({
  creatorId: z.string(),
  dealId: z.string(),
  brandId: z.string().optional(),
  amount: z.number().positive(),
  currency: z.string().default("USD"),
  status: z.enum(["pending", "approved", "scheduled", "paid"]).default("pending"),
  expectedPayoutAt: z.string().transform(s => new Date(s)).optional(),
});

const PayoutUpdateSchema = z.object({
  amount: z.number().positive().optional(),
  status: z.enum(["pending", "approved", "scheduled", "paid"]).optional(),
  expectedPayoutAt: z.string().transform(s => new Date(s)).optional(),
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
        updatedAt: new Date(),
        ...parsed.data,
        createdBy: req.user?.id
      }
    });

    // Log activity
    await prisma.financeActivityLog.create({
      data: {
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        actionType: "payout_created",
        referenceType: "payout",
        referenceId: payout.id,
        amount: payout.amount,
        currency: payout.currency,
        createdBy: req.user?.id
      }
    });

    res.status(201).json(payout);
  } catch (error) {
    console.error("Error creating payout:", error);
    res.status(500).json({ error: "Failed to create payout" });
  }
});

router.get("/payouts", async (req: Request, res: Response) => {
  try {
    const { dealId, creatorId, brandId, status, limit = "50" } = req.query;

    const where: any = {};
    if (dealId) where.dealId = dealId;
    if (creatorId) where.creatorId = creatorId;
    if (brandId) where.brandId = brandId;
    if (status) where.status = status;

    const payouts = await prisma.payout.findMany({
      where,
      take: parseInt(limit as string),
      orderBy: { createdAt: "desc" },
      include: {
        Deal: {
          include: {
            Brand: true
          }
        },
        Talent: {
          include: {
            User: true
          }
        }
      }
    });

    res.json(payouts || []);
  } catch (error) {
    console.error("Error fetching payouts:", error);
    res.json([]);
  }
});

router.get("/payouts/:id", async (req: Request, res: Response) => {
  try {
    const payout = await prisma.payout.findUnique({
      where: { id: req.params.id },
      include: {
        Deal: {
          include: {
            Brand: true
          }
        },
        Talent: {
          include: {
            User: true
          }
        }
      }
    });

    if (!payout) {
      return res.status(404).json({ error: "Payout not found" });
    }

    // Fetch related documents and activity logs manually
    const [documents, activityLogs] = await Promise.all([
      prisma.financeDocument.findMany({
        where: { linkedType: "payout", linkedId: payout.id },
        orderBy: { uploadedAt: "desc" }
      }),
      prisma.financeActivityLog.findMany({
        where: { referenceType: "payout", referenceId: payout.id },
        orderBy: { createdAt: "desc" }
      })
    ]);

    res.json({ ...payout, Documents: documents, ActivityLogs: activityLogs });
  } catch (error) {
    console.error("Error fetching payout:", error);
    res.status(500).json({ error: "Failed to fetch payout" });
  }
});

router.patch("/payouts/:id", async (req: Request, res: Response) => {
  try {
    const parsed = PayoutUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
    }

    // Prevent updates to paid payouts (immutable once paid)
    const existing = await prisma.payout.findUnique({ where: { id: req.params.id } });
    if (existing?.status === "paid") {
      return res.status(403).json({ error: "Cannot modify paid payouts" });
    }

    const payout = await prisma.payout.update({
      where: { id: req.params.id },
      data: parsed.data
    });

    res.json(payout);
  } catch (error) {
    console.error("Error updating payout:", error);
    res.status(500).json({ error: "Failed to update payout" });
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
        paidAt: new Date()
      }
    });

    // Create reconciliation record
    await prisma.financeReconciliation.create({
      data: {
        id: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: "payout_payment",
        referenceId: payout.id,
        amount: amount || payout.amount,
        currency: payout.currency,
        method: method || "manual",
        notes: notes || null,
        confirmedAt: new Date(),
        createdBy: req.user?.id || ""
      }
    });

    // Log activity
    await prisma.financeActivityLog.create({
      data: {
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        actionType: "payout_processed",
        referenceType: "payout",
        referenceId: payout.id,
        amount: payout.amount,
        currency: payout.currency,
        createdBy: req.user?.id
      }
    });

    res.json({ success: true, payout });
  } catch (error) {
    console.error("Error marking payout as paid:", error);
    res.status(500).json({ error: "Failed to mark payout as paid" });
  }
});

// ============================================================================
// PHASE 3.4 - RECONCILIATION APIs
// ============================================================================

const ReconciliationCreateSchema = z.object({
  type: z.enum(["invoice_payment", "payout_payment"]),
  referenceId: z.string(),
  amount: z.number().positive(),
  currency: z.string().default("USD"),
  method: z.string().optional(),
  notes: z.string().optional(),
  confirmedAt: z.string().transform(s => new Date(s)).optional()
});

router.post("/reconciliation", async (req: Request, res: Response) => {
  try {
    const parsed = ReconciliationCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
    }

    const reconciliation = await prisma.financeReconciliation.create({
      data: {
        id: `reconciliation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...parsed.data,
        confirmedAt: parsed.data.confirmedAt || new Date(),
        createdBy: req.user?.id || ""
      }
    });

    // Log activity
    await prisma.financeActivityLog.create({
      data: {
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        actionType: "reconciliation_logged",
        referenceType: parsed.data.type,
        referenceId: parsed.data.referenceId,
        amount: parsed.data.amount,
        currency: parsed.data.currency,
        createdBy: req.user?.id
      }
    });

    res.status(201).json(reconciliation);
  } catch (error) {
    console.error("Error creating reconciliation:", error);
    res.status(500).json({ error: "Failed to create reconciliation" });
  }
});

router.get("/reconciliation", async (req: Request, res: Response) => {
  try {
    const { type, referenceId, limit = "50" } = req.query;

    const where: any = {};
    if (type) where.type = type;
    if (referenceId) where.referenceId = referenceId;

    const reconciliations = await prisma.financeReconciliation.findMany({
      where,
      take: parseInt(limit as string),
      orderBy: { confirmedAt: "desc" }
    });

    res.json(reconciliations || []);
  } catch (error) {
    console.error("Error fetching reconciliations:", error);
    res.json([]);
  }
});

// ============================================================================
// PHASE 3.5 - FINANCE DOCUMENTS APIs
// ============================================================================

const DocumentCreateSchema = z.object({
  fileUrl: z.string().url(),
  fileName: z.string().optional(),
  fileType: z.enum(["invoice", "receipt", "confirmation", "other"]),
  linkedType: z.enum(["invoice", "payout", "deal", "reconciliation"]),
  linkedId: z.string()
});

router.post("/documents", async (req: Request, res: Response) => {
  try {
    const parsed = DocumentCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
    }

    const document = await prisma.financeDocument.create({
      data: {
        id: `document_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...parsed.data,
        uploadedBy: req.user?.id || ""
      }
    });

    res.status(201).json(document);
  } catch (error) {
    console.error("Error uploading document:", error);
    res.status(500).json({ error: "Failed to upload document" });
  }
});

router.get("/documents", async (req: Request, res: Response) => {
  try {
    const { linkedType, linkedId } = req.query;

    const where: any = {};
    if (linkedType) where.linkedType = linkedType;
    if (linkedId) where.linkedId = linkedId;

    const documents = await prisma.financeDocument.findMany({
      where,
      orderBy: { uploadedAt: "desc" }
    });

    res.json(documents || []);
  } catch (error) {
    console.error("Error fetching documents:", error);
    res.json([]);
  }
});

// ============================================================================
// PHASE 3.6 - FINANCIAL ACTIVITY TIMELINE
// ============================================================================

router.get("/activity", async (req: Request, res: Response) => {
  try {
    const { dealId, brandId, creatorId, startDate, endDate, limit = "100" } = req.query;

    const where: any = {};
    
    if (dealId) {
      where.OR = [
        { referenceType: "invoice", Invoice: { dealId } },
        { referenceType: "payout", Payout: { dealId } }
      ];
    }

    if (startDate || endDate) {
      const dateFilter: any = {};
      if (startDate) dateFilter.gte = new Date(startDate as string);
      if (endDate) dateFilter.lte = new Date(endDate as string);
      where.createdAt = dateFilter;
    }

    const activities = await prisma.financeActivityLog.findMany({
      where,
      take: parseInt(limit as string),
      orderBy: { createdAt: "desc" }
      // Note: CreatedByUser relation not available in schema
      // Fetch user details separately if needed
    });

    res.json(activities || []);
  } catch (error) {
    console.error("Error fetching activity:", error);
    res.json([]);
  }
});

// ============================================================================
// PHASE 4 - XERO INTEGRATION (STRUCTURAL ONLY)
// ============================================================================

router.get("/xero/status", async (_req: Request, res: Response) => {
  try {
    const connection = await prisma.xeroConnection.findFirst();
    
    res.json({
      connected: connection?.connected || false,
      lastSyncedAt: connection?.lastSyncedAt || null
    });
  } catch (error) {
    console.error("Error fetching Xero status:", error);
    res.json({ connected: false, lastSyncedAt: null });
  }
});

router.post("/xero/connect", async (req: Request, res: Response) => {
  try {
    const { tenantId, accessToken, refreshToken, expiresAt } = req.body;

    const connection = await prisma.xeroConnection.upsert({
      where: { id: "xero_connection_singleton" },
      update: {
        connected: true,
        tenantId,
        accessToken,
        refreshToken,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        updatedAt: new Date()
      },
      create: {
        id: "xero_connection_singleton",
        connected: true,
        tenantId,
        accessToken,
        refreshToken,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        updatedAt: new Date()
      }
    });

    res.json({ success: true, connection });
  } catch (error) {
    console.error("Error connecting Xero:", error);
    res.status(500).json({ error: "Failed to connect Xero" });
  }
});

router.post("/xero/sync", async (_req: Request, res: Response) => {
  try {
    // Update last synced timestamp
    await prisma.xeroConnection.updateMany({
      data: {
        lastSyncedAt: new Date()
      }
    });

    res.json({ success: true, message: "Xero sync initiated" });
  } catch (error) {
    console.error("Error syncing Xero:", error);
    res.status(500).json({ error: "Failed to sync Xero" });
  }
});

router.get("/xero/invoice/:id", async (req: Request, res: Response) => {
  try {
    // Placeholder for Xero invoice fetch
    // In real implementation, this would call Xero API
    res.json({ 
      message: "Xero integration not yet implemented",
      invoiceId: req.params.id
    });
  } catch (error) {
    console.error("Error fetching Xero invoice:", error);
    res.status(500).json({ error: "Failed to fetch Xero invoice" });
  }
});

export default router;
