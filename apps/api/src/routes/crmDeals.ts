import express from "express";
import { requireAuth } from "../middleware/auth.js";
import prisma from "../lib/prisma.js";
import { logAdminActivity } from "../lib/adminActivityLogger.js";
import { logDestructiveAction, logAuditEvent } from "../lib/auditLogger.js";
import { logError } from "../lib/logger.js";

const router = express.Router();

// GET /api/crm-deals - List all deals with optional filters
router.get("/", requireAuth, async (req, res) => {
  try {
    const { brandId, status, owner } = req.query;

    const where: any = {};
    if (brandId) where.brandId = brandId;
    if (status) where.status = status;
    if (owner) where.owner = owner;

    const deals = await prisma.deal.findMany({
      where,
      include: {
        Brand: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(deals || []);
  } catch (error) {
    // Phase 4: Fail loudly - no empty arrays on error
    logError("Failed to fetch deals", error, { userId: req.user?.id });
    res.status(500).json({ 
      error: "Failed to fetch deals",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// GET /api/crm-deals/:id - Get a single deal by ID
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const deal = await prisma.deal.findUnique({
      where: { id },
      include: {
        Brand: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!deal) {
      return res.status(404).json({ error: "Deal not found" });
    }

    res.json(deal);
  } catch (error) {
    // Phase 4: Fail loudly - explicit error handling
    logError("Failed to fetch deal", error, { dealId: id, userId: req.user?.id });
    if (error instanceof Error && error.message.includes("not found")) {
      return res.status(404).json({ error: "Deal not found" });
    }
    res.status(500).json({ 
      error: "Failed to fetch deal",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// POST /api/crm-deals - Create a new deal
router.post("/", requireAuth, async (req, res) => {
  try {
    const { dealName, brandId, dealType, status, estimatedValue, confidence, expectedCloseDate, actualCloseDate, internalSummary, termsNotes, owner, linkedCampaignIds, linkedTalentIds, linkedEventIds, notes } = req.body;

    // Validation
    if (!dealName || !dealName.trim()) {
      return res.status(400).json({ error: "Deal name is required" });
    }
    if (!brandId) {
      return res.status(400).json({ error: "Brand is required" });
    }
    if (!dealType) {
      return res.status(400).json({ error: "Deal type is required" });
    }

    const deal = await prisma.deal.create({
      data: {
        id: `deal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        dealName: dealName.trim(),
        brandId,
        dealType,
        status: status || "Prospect",
        estimatedValue: estimatedValue || null,
        confidence: confidence || "Medium",
        expectedCloseDate: expectedCloseDate || null,
        actualCloseDate: actualCloseDate || null,
        internalSummary: internalSummary || null,
        termsNotes: termsNotes || null,
        owner: owner || null,
        linkedCampaignIds: linkedCampaignIds || [],
        linkedTalentIds: linkedTalentIds || [],
        linkedEventIds: linkedEventIds || [],
        notes: notes || [],
        createdBy: req.user?.email || req.user?.name || "unknown",
      },
      include: {
        Brand: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Phase 2: Log to AdminActivity for activity feed
    // Phase 4: Add audit log for sensitive operation
    try {
      await Promise.all([
        logAdminActivity(req as any, {
          event: "CRM_DEAL_CREATED",
          metadata: { dealId: deal.id, dealName: deal.dealName, brandId: deal.brandId }
        }),
        logAuditEvent(req as any, {
          action: "DEAL_CREATED",
          entityType: "Deal",
          entityId: deal.id,
          metadata: { dealName: deal.dealName, brandId: deal.brandId, estimatedValue: deal.estimatedValue }
        })
      ]);
    } catch (logError) {
      console.error("Failed to log activity/audit:", logError);
      // Don't fail the request if logging fails
    }

    res.status(201).json(deal);
  } catch (error) {
    console.error("[crmDeals] Error creating deal:", error);
    res.status(500).json({ error: "Failed to create deal" });
  }
});

// PATCH /api/crm-deals/:id - Update a deal
router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { dealName, brandId, dealType, status, estimatedValue, confidence, expectedCloseDate, actualCloseDate, internalSummary, termsNotes, owner, linkedCampaignIds, linkedTalentIds, linkedEventIds, notes } = req.body;

    const updateData: any = {};
    if (dealName !== undefined) updateData.dealName = dealName.trim();
    if (brandId !== undefined) updateData.brandId = brandId;
    if (dealType !== undefined) updateData.dealType = dealType;
    if (status !== undefined) updateData.status = status;
    if (estimatedValue !== undefined) updateData.estimatedValue = estimatedValue;
    if (confidence !== undefined) updateData.confidence = confidence;
    if (expectedCloseDate !== undefined) updateData.expectedCloseDate = expectedCloseDate;
    if (actualCloseDate !== undefined) updateData.actualCloseDate = actualCloseDate;
    if (internalSummary !== undefined) updateData.internalSummary = internalSummary;
    if (termsNotes !== undefined) updateData.termsNotes = termsNotes;
    if (owner !== undefined) updateData.owner = owner;
    if (linkedCampaignIds !== undefined) updateData.linkedCampaignIds = linkedCampaignIds;
    if (linkedTalentIds !== undefined) updateData.linkedTalentIds = linkedTalentIds;
    if (linkedEventIds !== undefined) updateData.linkedEventIds = linkedEventIds;
    if (notes !== undefined) updateData.notes = notes;

    const deal = await prisma.deal.update({
      where: { id },
      data: updateData,
      include: {
        Brand: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Phase 2: Log to AdminActivity for activity feed
    // Phase 4: Add audit log for sensitive operation
    try {
      await Promise.all([
        logAdminActivity(req as any, {
          event: "CRM_DEAL_UPDATED",
          metadata: { dealId: deal.id, dealName: deal.dealName, changes: Object.keys(updateData) }
        }),
        logAuditEvent(req as any, {
          action: "DEAL_UPDATED",
          entityType: "Deal",
          entityId: deal.id,
          metadata: { dealName: deal.dealName, changes: Object.keys(updateData) }
        })
      ]);
    } catch (logError) {
      console.error("Failed to log activity/audit:", logError);
      // Don't fail the request if logging fails
    }

    res.json(deal);
  } catch (error) {
    console.error("[crmDeals] Error updating deal:", error);
    res.status(500).json({ error: "Failed to update deal" });
  }
});

// DELETE /api/crm-deals/:id - Delete a deal
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Phase 4: Get deal info before deletion for audit logging
    const deal = await prisma.deal.findUnique({ 
      where: { id },
      select: { id: true, dealName: true, brandId: true }
    });
    if (!deal) {
      return res.status(404).json({ error: "Deal not found" });
    }

    await prisma.deal.delete({
      where: { id },
    });

    // Phase 4: Log destructive action
    try {
      await Promise.all([
        logDestructiveAction(req as any, {
          action: "DEAL_DELETED",
          entityType: "Deal",
          entityId: deal.id,
          metadata: { dealName: deal.dealName, brandId: deal.brandId }
        }),
        logAdminActivity(req as any, {
          event: "CRM_DEAL_DELETED",
          metadata: { dealId: deal.id, dealName: deal.dealName }
        })
      ]);
    } catch (logError) {
      console.error("Failed to log destructive action:", logError);
      // Don't fail the request if logging fails
    }

    res.json({ success: true });
  } catch (error) {
    // Phase 4: Fail loudly
    logError("Failed to delete deal", error, { dealId: req.params.id, userId: req.user?.id });
    res.status(500).json({ 
      error: "Failed to delete deal",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// POST /api/crm-deals/:id/notes - Add a note to a deal
router.post("/:id/notes", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { text, author } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Note text is required" });
    }

    const deal = await prisma.deal.findUnique({
      where: { id },
    });

    if (!deal) {
      return res.status(404).json({ error: "Deal not found" });
    }

    const newNote = {
      at: new Date().toISOString(),
      author: author || req.user?.email || req.user?.name || "unknown",
      text: text.trim(),
    };

    const notes = Array.isArray(deal.notes) ? [...deal.notes, newNote] : [newNote];

    const updatedDeal = await prisma.deal.update({
      where: { id },
      data: { notes },
      include: {
        Brand: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.json(updatedDeal);
  } catch (error) {
    console.error("[crmDeals] Error adding note:", error);
    res.status(500).json({ error: "Failed to add note" });
  }
});

// POST /api/crm-deals/batch-import - Import deals from localStorage
router.post("/batch-import", requireAuth, async (req, res) => {
  try {
    const { deals } = req.body;

    if (!Array.isArray(deals) || deals.length === 0) {
      return res.status(400).json({ error: "Deals array is required" });
    }

    const results = {
      imported: 0,
      skipped: 0,
      errors: [] as string[],
    };

    for (const deal of deals) {
      try {
        // Skip if deal name or brand ID is missing
        if (!deal.dealName || !deal.brandId) {
          results.skipped++;
          results.errors.push(`Deal "${deal.dealName || 'unnamed'}" missing required fields`);
          continue;
        }

        // Check if brand exists
        const brandExists = await prisma.crmBrand.findUnique({
          where: { id: deal.brandId },
        });

        if (!brandExists) {
          results.skipped++;
          results.errors.push(`Brand not found for deal "${deal.dealName}"`);
          continue;
        }

        await prisma.crmDeal.create({
          data: {
            id: `deal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            dealName: deal.dealName,
            brandId: deal.brandId,
            dealType: deal.dealType || "Other",
            status: deal.status || "Prospect",
            estimatedValue: deal.estimatedValue || null,
            confidence: deal.confidence || "Medium",
            expectedCloseDate: deal.expectedCloseDate || null,
            actualCloseDate: deal.actualCloseDate || null,
            internalSummary: deal.internalSummary || null,
            termsNotes: deal.termsNotes || null,
            owner: deal.owner || null,
            linkedCampaignIds: deal.linkedCampaignIds || [],
            linkedTalentIds: deal.linkedTalentIds || [],
            linkedEventIds: deal.linkedEventIds || [],
            notes: deal.notes || [],
            createdBy: deal.createdBy || req.user?.email || req.user?.name || "migration",
            createdAt: deal.createdAt ? new Date(deal.createdAt) : new Date(),
            updatedAt: deal.updatedAt ? new Date(deal.updatedAt) : new Date(),
          },
        });

        results.imported++;
      } catch (error: any) {
        results.skipped++;
        results.errors.push(`Failed to import deal "${deal.dealName}": ${error.message}`);
      }
    }

    res.json(results);
  } catch (error) {
    console.error("[crmDeals] Error importing deals:", error);
    res.status(500).json({ error: "Failed to import deals" });
  }
});

export default router;
