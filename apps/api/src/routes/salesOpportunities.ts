import { Router } from "express";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/adminAuth.js";
import {
  logOpportunityClose,
  logDealConversion,
  logOutreachAudit,
  OutreachAuditAction
} from "../services/outreach/auditLogger.js";

const router = Router();

// POST /api/sales-opportunities - Create opportunity from outreach
router.post("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { outreachId, name, value, currency, expectedCloseAt, notes } = req.body;

    if (!outreachId) {
      return res.status(400).json({ error: "outreachId is required" });
    }

    // Verify outreach exists
    const outreach = await prisma.outreach.findUnique({
      where: { id: outreachId }
    });

    if (!outreach) {
      return res.status(404).json({ error: "Outreach record not found" });
    }

    // Check if opportunity already exists for this outreach
    const existing = await prisma.salesOpportunity.findUnique({
      where: { outreachId }
    });

    if (existing) {
      return res.status(400).json({ error: "Opportunity already exists for this outreach" });
    }

    const opportunity = await prisma.salesOpportunity.create({
      data: {
        id: `opportunity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        updatedAt: new Date(),
        outreachId,
        name: name || outreach.target,
        value: value || 0,
        currency: currency || "USD",
        expectedCloseAt: expectedCloseAt ? new Date(expectedCloseAt) : null,
        notes,
        status: "open"
      },
      include: {
        Outreach: true
      }
    });

    // Audit log
    await logOutreachAudit({
      action: OutreachAuditAction.OPPORTUNITY_CREATED,
      entityType: "opportunity",
      entityId: opportunity.id,
      userId: req.user?.id || "system",
      metadata: { outreachId, name: opportunity.name }
    });

    return res.status(201).json({ opportunity });
  } catch (error) {
    console.error("[OPPORTUNITY_CREATE] Error:", error);
    res.status(500).json({ error: "Failed to create opportunity" });
  }
});

// GET /api/sales-opportunities - List all opportunities
router.get("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { status, owner } = req.query;

    const where: any = {};
    if (status) where.status = status;
    if (owner) where.Outreach = { owner };

    const opportunities = await prisma.salesOpportunity.findMany({
      where,
      include: {
        Outreach: {
          select: {
            id: true,
            target: true,
            owner: true,
            stage: true,
            contact: true,
            contactEmail: true,
            lastContact: true
          }
        },
        Deal: {
          select: {
            id: true,
            stage: true,
            value: true,
            currency: true
          }
        }
      },
      orderBy: { updatedAt: "desc" }
    });

    return res.json({ opportunities });
  } catch (error) {
    console.error("[OPPORTUNITY_LIST] Error:", error);
    // Safe default: return empty array on error
    return res.json({ opportunities: [] });
  }
});

// GET /api/sales-opportunities/:id - Get single opportunity
router.get("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const opportunity = await prisma.salesOpportunity.findUnique({
      where: { id },
      include: {
        Outreach: {
          include: {
            OutreachNote: {
              orderBy: { createdAt: "desc" }
            },
            OutreachTask: {
              orderBy: { dueDate: "asc" }
            }
          }
        },
        Deal: true
      }
    });

    if (!opportunity) {
      return res.status(404).json({ error: "Opportunity not found" });
    }

    res.json({ opportunity });
  } catch (error) {
    console.error("[OPPORTUNITY_GET] Error:", error);
    return res.status(500).json({ error: "Failed to fetch opportunity" });
  }
});

// PATCH /api/sales-opportunities/:id - Update opportunity
router.patch("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (updates.expectedCloseAt) {
      updates.expectedCloseAt = new Date(updates.expectedCloseAt);
    }

    const opportunity = await prisma.salesOpportunity.update({
      where: { id },
      data: updates,
      include: {
        Outreach: true,
        Deal: true
      }
    });

    return return res.json({ opportunity });
  } catch (error) {
    console.error("[OPPORTUNITY_UPDATE] Error:", error);
    return res.status(500).json({ error: "Failed to update opportunity" });
  }
});

// POST /api/sales-opportunities/:id/convert-to-deal - Convert opportunity to deal
router.post("/:id/convert-to-deal", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { talentId, brandId, brandName, value, currency, notes } = req.body;

    const opportunity = await prisma.salesOpportunity.findUnique({
      where: { id },
      include: { Outreach: true, Deal: true }
    });

    if (!opportunity) {
      return res.status(404).json({ error: "Opportunity not found" });
    }

    if (opportunity.Deal) {
      return res.status(400).json({ error: "Opportunity already converted to deal" });
    }

    if (!talentId || !brandId) {
      return res.status(400).json({ error: "talentId and brandId are required" });
    }

    // Transaction: Create deal and update opportunity atomically
    const result = await prisma.$transaction(async (tx) => {
      // Create deal linked to opportunity
      const deal = await tx.deal.create({
        data: {
          id: `deal_${Date.now()}`,
          userId: req.user!.id,
          talentId,
          brandId,
          opportunityId: id,
          stage: "NEW_LEAD",
          value: value || opportunity.value,
          currency: currency || opportunity.currency,
          brandName: brandName || opportunity.name,
          notes: notes || opportunity.notes || "",
          updatedAt: new Date()
        },
        include: {
          SalesOpportunity: {
            include: {
              Outreach: {
                include: {
                  OutreachNote: true,
                  OutreachTask: true
                }
              }
            }
          }
        }
      });

      // Update opportunity status
      const updatedOpp = await tx.salesOpportunity.update({
        where: { id },
        data: { status: "closed_won" }
      });

      return { deal, opportunity: updatedOpp };
    });

    // Audit log
    await logDealConversion(
      id,
      result.deal.id,
      req.user?.id || "system",
      result.deal.value ?? 0,
      result.deal.currency
    );

    return res.json({ 
      deal: result.deal,
      message: "Opportunity successfully converted to deal" 
    });
  } catch (error) {
    console.error("[OPPORTUNITY_CONVERT] Error:", error);
    return res.status(500).json({ error: "Failed to convert opportunity to deal" });
  }
});

// POST /api/sales-opportunities/:id/close - Close opportunity (won or lost)
router.post("/:id/close", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    if (!["closed_won", "closed_lost"].includes(status)) {
      return res.status(400).json({ error: "Status must be closed_won or closed_lost" });
    }

    const opportunity = await prisma.salesOpportunity.update({
      where: { id },
      data: { 
        status,
        notes: reason ? `${status}: ${reason}` : undefined
      }
    });

    // Audit log
    await logOpportunityClose(
      id,
      req.user?.id || "system",
      status,
      reason
    );

    return res.json({ opportunity });
  } catch (error) {
    console.error("[OPPORTUNITY_CLOSE] Error:", error);
    return res.status(500).json({ error: "Failed to close opportunity" });
  }
});

export default router;
