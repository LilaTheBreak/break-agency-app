import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";
import prisma from "../lib/prisma.js";
import { logError } from "../lib/logger.js";
import { logAuditEvent } from "../lib/auditLogger.js";

const router = Router();

// Phase 5: Feature flag check
const checkOutreachLeadsEnabled = (req: Request, res: Response, next: Function) => {
  const enabled = process.env.OUTREACH_LEADS_ENABLED === "true";
  if (!enabled) {
    return res.status(503).json({
      error: "Outreach Leads feature is disabled",
      message: "This feature is currently disabled. Contact an administrator to enable it.",
      code: "FEATURE_DISABLED"
    });
  }
  next();
};

router.use(requireAuth, requireRole(['ADMIN', 'SUPERADMIN']), checkOutreachLeadsEnabled);

/**
 * GET /api/outreach/leads
 * List all outreach leads (admin only)
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const { status, source } = req.query;

    const where: any = {};
    if (status) {
      where.status = status as string;
    }
    if (source) {
      where.source = source as string;
    }

    const leads = await prisma.outreachLead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100
    });

    res.json({ leads });
  } catch (error) {
    logError("Failed to fetch outreach leads", error, { userId: req.user?.id });
    res.status(500).json({ 
      error: "Failed to fetch leads",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * POST /api/outreach/leads
 * Create a new outreach lead (admin only)
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const {
      brandName,
      contactName,
      contactEmail,
      contactPhone,
      website,
      industry,
      source,
      notes
    } = req.body;

    if (!brandName) {
      return res.status(400).json({ 
        error: "brandName is required" 
      });
    }

    const lead = await prisma.outreachLead.create({
      data: {
        id: `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        brandName,
        contactName: contactName || null,
        contactEmail: contactEmail || null,
        contactPhone: contactPhone || null,
        website: website || null,
        industry: industry || null,
        source: source || null,
        notes: notes || null,
        status: "new",
        createdBy: req.user!.id
      }
    });

    // Audit log
    try {
      await logAuditEvent(req as any, {
        action: "OUTREACH_LEAD_CREATED",
        entityType: "OutreachLead",
        entityId: lead.id,
        metadata: { brandName, source }
      });
    } catch (logError) {
      console.error("Failed to log audit event:", logError);
    }

    res.status(201).json({ lead });
  } catch (error) {
    logError("Failed to create outreach lead", error, { userId: req.user?.id });
    res.status(500).json({ 
      error: "Failed to create lead",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * PATCH /api/outreach/leads/:id
 * Update outreach lead status (admin only)
 */
router.patch("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, notes, convertedToOutreachId } = req.body;

    const existing = await prisma.outreachLead.findUnique({
      where: { id }
    });

    if (!existing) {
      return res.status(404).json({ 
        error: "Lead not found" 
      });
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (convertedToOutreachId) updateData.convertedToOutreachId = convertedToOutreachId;

    const lead = await prisma.outreachLead.update({
      where: { id },
      data: updateData
    });

    // Audit log
    try {
      await logAuditEvent(req as any, {
        action: "OUTREACH_LEAD_UPDATED",
        entityType: "OutreachLead",
        entityId: lead.id,
        metadata: { status, convertedToOutreachId }
      });
    } catch (logError) {
      console.error("Failed to log audit event:", logError);
    }

    res.json({ lead });
  } catch (error) {
    logError("Failed to update outreach lead", error, { leadId: req.params.id });
    res.status(500).json({ 
      error: "Failed to update lead",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * POST /api/outreach/leads/:id/convert
 * Convert lead to outreach record (admin only)
 */
router.post("/:id/convert", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const lead = await prisma.outreachLead.findUnique({
      where: { id }
    });

    if (!lead) {
      return res.status(404).json({ 
        error: "Lead not found" 
      });
    }

    if (lead.status === "converted") {
      return res.status(400).json({ 
        error: "Lead already converted" 
      });
    }

    // Create outreach record
    const outreach = await prisma.outreach.create({
      data: {
        id: `outreach_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        target: lead.brandName,
        type: "Brand",
        contact: lead.contactName || null,
        contactEmail: lead.contactEmail || null,
        link: lead.website || null,
        source: lead.source || "lead_conversion",
        stage: "not-started",
        status: "Not started",
        summary: lead.notes || null,
        createdBy: req.user!.id,
        updatedAt: new Date()
      }
    });

    // Update lead
    const updatedLead = await prisma.outreachLead.update({
      where: { id },
      data: {
        status: "converted",
        convertedToOutreachId: outreach.id
      }
    });

    // Audit log
    try {
      await logAuditEvent(req as any, {
        action: "OUTREACH_LEAD_CONVERTED",
        entityType: "OutreachLead",
        entityId: lead.id,
        metadata: { outreachId: outreach.id }
      });
    } catch (logError) {
      console.error("Failed to log audit event:", logError);
    }

    res.json({ lead: updatedLead, outreach });
  } catch (error) {
    logError("Failed to convert outreach lead", error, { leadId: req.params.id });
    res.status(500).json({ 
      error: "Failed to convert lead",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;
