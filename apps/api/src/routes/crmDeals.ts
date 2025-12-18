import express from "express";
import { requireAuth } from "../middleware/auth.js";
import prisma from "../lib/prisma.js";

const router = express.Router();

// GET /api/crm-deals - List all deals with optional filters
router.get("/", requireAuth, async (req, res) => {
  try {
    const { brandId, status, owner } = req.query;

    const where: any = {};
    if (brandId) where.brandId = brandId;
    if (status) where.status = status;
    if (owner) where.owner = owner;

    const deals = await prisma.crmDeal.findMany({
      where,
      include: {
        Brand: {
          select: {
            id: true,
            brandName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(deals);
  } catch (error) {
    console.error("[crmDeals] Error fetching deals:", error);
    res.status(500).json({ error: "Failed to fetch deals" });
  }
});

// GET /api/crm-deals/:id - Get a single deal by ID
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const deal = await prisma.crmDeal.findUnique({
      where: { id },
      include: {
        Brand: {
          select: {
            id: true,
            brandName: true,
          },
        },
      },
    });

    if (!deal) {
      return res.status(404).json({ error: "Deal not found" });
    }

    res.json(deal);
  } catch (error) {
    console.error("[crmDeals] Error fetching deal:", error);
    res.status(500).json({ error: "Failed to fetch deal" });
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

    const deal = await prisma.crmDeal.create({
      data: {
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
            brandName: true,
          },
        },
      },
    });

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

    const deal = await prisma.crmDeal.update({
      where: { id },
      data: updateData,
      include: {
        Brand: {
          select: {
            id: true,
            brandName: true,
          },
        },
      },
    });

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

    await prisma.crmDeal.delete({
      where: { id },
    });

    res.json({ success: true });
  } catch (error) {
    console.error("[crmDeals] Error deleting deal:", error);
    res.status(500).json({ error: "Failed to delete deal" });
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

    const deal = await prisma.crmDeal.findUnique({
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

    const updatedDeal = await prisma.crmDeal.update({
      where: { id },
      data: { notes },
      include: {
        Brand: {
          select: {
            id: true,
            brandName: true,
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
            id: deal.id, // Preserve original ID if possible
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
