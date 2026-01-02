import express from "express";
import { requireAuth } from "../middleware/auth.js";
import prisma from "../lib/prisma.js";
import { logAdminActivity } from "../lib/adminActivityLogger.js";
import { logDestructiveAction, logAuditEvent } from "../lib/auditLogger.js";
import { logError } from "../lib/logger.js";
import { DealStage } from "@prisma/client";

const router = express.Router();

// GET /api/crm-deals - List all deals with optional filters
router.get("/", requireAuth, async (req, res) => {
  try {
    const { brandId, status, owner } = req.query;

    const where: any = {};
    if (brandId) where.brandId = brandId;
    if (status) {
      // Map status string to DealStage enum if needed
      const stageMap: Record<string, DealStage> = {
        "Prospect": DealStage.NEW_LEAD,
        "Negotiation": DealStage.NEGOTIATION,
        "Contract Sent": DealStage.CONTRACT_SENT,
        "Contract Signed": DealStage.CONTRACT_SIGNED,
        "In Progress": DealStage.DELIVERABLES_IN_PROGRESS,
        "Payment Pending": DealStage.PAYMENT_PENDING,
        "Payment Received": DealStage.PAYMENT_RECEIVED,
        "Completed": DealStage.COMPLETED,
        "Lost": DealStage.LOST,
      };
      where.stage = stageMap[status as string] || status;
    }
    if (owner) where.userId = owner;

    const deals = await prisma.deal.findMany({
      where,
      include: {
        Brand: {
          select: {
            id: true,
            name: true,
          },
        },
        Talent: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Transform deals to include dealName (from brandName) for backward compatibility
    const transformedDeals = deals.map(deal => ({
      ...deal,
      dealName: deal.brandName || `Deal with ${deal.Brand?.name || 'Unknown Brand'}`,
      status: deal.stage,
      estimatedValue: deal.value,
      expectedCloseDate: deal.expectedClose,
    }));

    // CRITICAL: Ensure we always return an array, never an empty string
    const safeDeals = Array.isArray(transformedDeals) ? transformedDeals : [];
    res.json(safeDeals);
  } catch (error) {
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
        Talent: {
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

    // Transform deal to include dealName for backward compatibility
    const transformedDeal = {
      ...deal,
      dealName: deal.brandName || `Deal with ${deal.Brand?.name || 'Unknown Brand'}`,
      status: deal.stage,
      estimatedValue: deal.value,
      expectedCloseDate: deal.expectedClose,
    };

    res.json(transformedDeal);
  } catch (error) {
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
    const { dealName, brandId, status, estimatedValue, expectedCloseDate, notes, userId, talentId } = req.body;

    // Validation
    if (!dealName || !dealName.trim()) {
      return res.status(400).json({ error: "Deal name is required" });
    }
    if (!brandId) {
      return res.status(400).json({ error: "Brand is required" });
    }
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }
    if (!talentId) {
      return res.status(400).json({ error: "Talent ID is required" });
    }

    // Map status string to DealStage enum
    const stageMap: Record<string, DealStage> = {
      "Prospect": DealStage.NEW_LEAD,
      "Negotiation": DealStage.NEGOTIATION,
      "Contract Sent": DealStage.CONTRACT_SENT,
      "Contract Signed": DealStage.CONTRACT_SIGNED,
      "In Progress": DealStage.DELIVERABLES_IN_PROGRESS,
      "Payment Pending": DealStage.PAYMENT_PENDING,
      "Payment Received": DealStage.PAYMENT_RECEIVED,
      "Completed": DealStage.COMPLETED,
      "Lost": DealStage.LOST,
    };
    const stage = status ? (stageMap[status] || DealStage.NEW_LEAD) : DealStage.NEW_LEAD;

    const deal = await prisma.deal.create({
      data: {
        id: `deal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        brandName: dealName.trim(), // Deal model uses brandName
        brandId,
        userId,
        talentId,
        stage,
        value: estimatedValue || null,
        expectedClose: expectedCloseDate ? new Date(expectedCloseDate) : null,
        notes: notes || null,
        updatedAt: new Date(),
      },
      include: {
        Brand: {
          select: {
            id: true,
            name: true,
          },
        },
        Talent: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Log activity
    try {
      await Promise.all([
        logAdminActivity(req as any, {
          event: "CRM_DEAL_CREATED",
          metadata: { dealId: deal.id, dealName: deal.brandName, brandId: deal.brandId }
        }),
        logAuditEvent(req as any, {
          action: "DEAL_CREATED",
          entityType: "Deal",
          entityId: deal.id,
          metadata: { dealName: deal.brandName, brandId: deal.brandId, value: deal.value }
        })
      ]);
    } catch (logError) {
      console.error("Failed to log activity/audit:", logError);
    }

    // Transform response for backward compatibility
    const transformedDeal = {
      ...deal,
      dealName: deal.brandName,
      status: deal.stage,
      estimatedValue: deal.value,
      expectedCloseDate: deal.expectedClose,
    };

    res.status(201).json(transformedDeal);
  } catch (error) {
    console.error("[crmDeals] Error creating deal:", error);
    res.status(500).json({ 
      error: "Failed to create deal",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// PATCH /api/crm-deals/:id - Update a deal
router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { dealName, brandId, status, estimatedValue, expectedCloseDate, notes } = req.body;

    const updateData: any = {};
    if (dealName !== undefined) updateData.brandName = dealName.trim();
    if (brandId !== undefined) updateData.brandId = brandId;
    if (status !== undefined) {
      const stageMap: Record<string, DealStage> = {
        "Prospect": DealStage.NEW_LEAD,
        "Negotiation": DealStage.NEGOTIATION,
        "Contract Sent": DealStage.CONTRACT_SENT,
        "Contract Signed": DealStage.CONTRACT_SIGNED,
        "In Progress": DealStage.DELIVERABLES_IN_PROGRESS,
        "Payment Pending": DealStage.PAYMENT_PENDING,
        "Payment Received": DealStage.PAYMENT_RECEIVED,
        "Completed": DealStage.COMPLETED,
        "Lost": DealStage.LOST,
      };
      updateData.stage = stageMap[status] || DealStage.NEW_LEAD;
    }
    if (estimatedValue !== undefined) updateData.value = estimatedValue;
    if (expectedCloseDate !== undefined) updateData.expectedClose = expectedCloseDate ? new Date(expectedCloseDate) : null;
    if (notes !== undefined) updateData.notes = notes;
    updateData.updatedAt = new Date();

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
        Talent: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Log activity
    try {
      await Promise.all([
        logAdminActivity(req as any, {
          event: "CRM_DEAL_UPDATED",
          metadata: { dealId: deal.id, dealName: deal.brandName, changes: Object.keys(updateData) }
        }),
        logAuditEvent(req as any, {
          action: "DEAL_UPDATED",
          entityType: "Deal",
          entityId: deal.id,
          metadata: { dealName: deal.brandName, changes: Object.keys(updateData) }
        })
      ]);
    } catch (logError) {
      console.error("Failed to log activity/audit:", logError);
    }

    // Transform response
    const transformedDeal = {
      ...deal,
      dealName: deal.brandName,
      status: deal.stage,
      estimatedValue: deal.value,
      expectedCloseDate: deal.expectedClose,
    };

    res.json(transformedDeal);
  } catch (error) {
    console.error("[crmDeals] Error updating deal:", error);
    res.status(500).json({ 
      error: "Failed to update deal",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// DELETE /api/crm-deals/:id - Delete a deal
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const deal = await prisma.deal.findUnique({ 
      where: { id },
      select: { id: true, brandName: true, brandId: true }
    });
    if (!deal) {
      return res.status(404).json({ error: "Deal not found" });
    }

    await prisma.deal.delete({
      where: { id },
    });

    // Log destructive action
    try {
      await Promise.all([
        logDestructiveAction(req as any, {
          action: "DEAL_DELETED",
          entityType: "Deal",
          entityId: deal.id,
          metadata: { dealName: deal.brandName, brandId: deal.brandId }
        }),
        logAdminActivity(req as any, {
          event: "CRM_DEAL_DELETED",
          metadata: { dealId: deal.id, dealName: deal.brandName }
        })
      ]);
    } catch (logError) {
      console.error("Failed to log destructive action:", logError);
    }

    res.json({ success: true });
  } catch (error) {
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

    // Deal.notes is a string, not an array - append to it
    const authorName = author || req.user?.email || req.user?.name || "unknown";
    const timestamp = new Date().toISOString();
    const newNote = `[${timestamp}] ${authorName}: ${text.trim()}`;
    const updatedNotes = deal.notes ? `${deal.notes}\n${newNote}` : newNote;

    const updatedDeal = await prisma.deal.update({
      where: { id },
      data: { notes: updatedNotes },
      include: {
        Brand: {
          select: {
            id: true,
            name: true,
          },
        },
        Talent: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Transform response
    const transformedDeal = {
      ...updatedDeal,
      dealName: updatedDeal.brandName,
      status: updatedDeal.stage,
      estimatedValue: updatedDeal.value,
      expectedCloseDate: updatedDeal.expectedClose,
    };

    res.json(transformedDeal);
  } catch (error) {
    console.error("[crmDeals] Error adding note:", error);
    res.status(500).json({ 
      error: "Failed to add note",
      message: error instanceof Error ? error.message : "Unknown error"
    });
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

    const stageMap: Record<string, DealStage> = {
      "Prospect": DealStage.NEW_LEAD,
      "Negotiation": DealStage.NEGOTIATION,
      "Contract Sent": DealStage.CONTRACT_SENT,
      "Contract Signed": DealStage.CONTRACT_SIGNED,
      "In Progress": DealStage.DELIVERABLES_IN_PROGRESS,
      "Payment Pending": DealStage.PAYMENT_PENDING,
      "Payment Received": DealStage.PAYMENT_RECEIVED,
      "Completed": DealStage.COMPLETED,
      "Lost": DealStage.LOST,
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
        const brandExists = await prisma.brand.findUnique({
          where: { id: deal.brandId },
        });

        if (!brandExists) {
          results.skipped++;
          results.errors.push(`Brand not found for deal "${deal.dealName}"`);
          continue;
        }

        // Require userId and talentId for Deal model
        if (!deal.userId || !deal.talentId) {
          results.skipped++;
          results.errors.push(`Deal "${deal.dealName}" missing userId or talentId`);
          continue;
        }

        await prisma.deal.create({
          data: {
            id: `deal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            brandName: deal.dealName,
            brandId: deal.brandId,
            userId: deal.userId,
            talentId: deal.talentId,
            stage: deal.status ? (stageMap[deal.status] || DealStage.NEW_LEAD) : DealStage.NEW_LEAD,
            value: deal.estimatedValue || null,
            expectedClose: deal.expectedCloseDate ? new Date(deal.expectedCloseDate) : null,
            notes: deal.notes || null,
            updatedAt: new Date(),
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
    res.status(500).json({ 
      error: "Failed to import deals",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;
