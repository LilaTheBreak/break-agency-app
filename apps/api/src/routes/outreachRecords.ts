import { Router, type Request, type Response } from "express";
import { requireAuth } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';

const router = Router();

// GET /api/outreach-records - Get all outreach records (with filters)
router.get("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const { brandId, contactId, dealId, outcome, channel, limit } = req.query;

    const where: any = {};
    if (brandId) where.linkedCrmBrandId = String(brandId);
    // contactId, dealId filters removed - not in Outreach model
    if (outcome) where.status = String(outcome); // status field exists
    // channel filter removed - not in Outreach model

    const records = await prisma.outreach.findMany({
      where,
      include: {
        CrmBrand: {
          select: {
            id: true,
            brandName: true,
            status: true,
            website: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit ? Number(limit) : undefined,
    });

    res.json({ records });
  } catch (error) {
    console.error("[OUTREACH RECORDS] Error fetching records:", error);
    res.status(500).json({ error: "Failed to fetch outreach records" });
  }
});

// GET /api/outreach-records/:id - Get single outreach record
router.get("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const record = await prisma.outreach.findUnique({
      where: { id },
      include: {
        CrmBrand: true,
      },
    });

    if (!record) {
      return res.status(404).json({ error: "Outreach record not found" });
    }

    res.json({ record });
  } catch (error) {
    console.error("[OUTREACH RECORDS] Error fetching record:", error);
    res.status(500).json({ error: "Failed to fetch outreach record" });
  }
});

// POST /api/outreach-records - Create outreach record
router.post("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const {
      direction,
      channel,
      summary,
      fullNotes,
      brandId,
      contactId,
      dealId,
      campaignId,
      talentId,
      outcome,
      followUpSuggested,
      followUpBy,
      visibility,
      createdBy,
    } = req.body;

    if (!brandId) {
      return res.status(400).json({ error: "Brand ID is required" });
    }

    if (!summary?.trim()) {
      return res.status(400).json({ error: "Summary is required" });
    }

    if (!direction || !channel) {
      return res.status(400).json({ error: "Direction and channel are required" });
    }

    const record = await prisma.outreach.create({
      data: {
        id: `outreach_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        target: summary.trim(),
        type: "Brand",
        contact: contactId || null,
        contactEmail: null,
        summary: fullNotes?.trim() || null,
        linkedCrmBrandId: brandId,
        linkedCreatorId: talentId || null,
        status: outcome || "Not started",
        stage: "not-started",
        nextFollowUp: followUpBy ? new Date(followUpBy) : null,
        createdBy: req.user?.id || createdBy || "unknown",
        updatedAt: new Date(),
      },
      include: {
        CrmBrand: {
          select: {
            id: true,
            brandName: true,
            status: true,
            website: true,
          },
        },
      },
    });

    res.json({ record });
  } catch (error) {
    console.error("[OUTREACH RECORDS] Error creating record:", error);
    res.status(500).json({ error: "Failed to create outreach record" });
  }
});

// PATCH /api/outreach-records/:id - Update outreach record
router.patch("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      direction,
      channel,
      summary,
      fullNotes,
      contactId,
      dealId,
      campaignId,
      talentId,
      outcome,
      followUpSuggested,
      followUpBy,
      visibility,
    } = req.body;

    const existing = await prisma.outreach.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Outreach record not found" });
    }

    const record = await prisma.outreach.update({
      where: { id },
      data: {
        target: summary?.trim() || existing.target,
        summary: fullNotes?.trim() || existing.summary,
        contact: contactId !== undefined ? (contactId || null) : existing.contact,
        linkedCreatorId: talentId !== undefined ? (talentId || null) : existing.linkedCreatorId,
        status: outcome || existing.status,
        nextFollowUp: followUpBy !== undefined ? (followUpBy ? new Date(followUpBy) : null) : existing.nextFollowUp,
      },
      include: {
        CrmBrand: {
          select: {
            id: true,
            brandName: true,
            status: true,
            website: true,
          },
        },
      },
    });

    res.json({ record });
  } catch (error) {
    console.error("[OUTREACH RECORDS] Error updating record:", error);
    res.status(500).json({ error: "Failed to update outreach record" });
  }
});

// DELETE /api/outreach-records/:id - Delete outreach record
router.delete("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.outreach.delete({ where: { id } });

    res.json({ success: true });
  } catch (error) {
    console.error("[OUTREACH RECORDS] Error deleting record:", error);
    res.status(500).json({ error: "Failed to delete outreach record" });
  }
});

// GET /api/outreach-records/summary/stats - Get outreach statistics
router.get("/summary/stats", requireAuth, async (req: Request, res: Response) => {
  try {
    const { brandId } = req.query;

    const where = brandId ? { linkedCrmBrandId: String(brandId) } : {};

    const [total, byOutcome, byStage, needsFollowUp] = await Promise.all([
      prisma.outreach.count({ where }),
      prisma.outreach.groupBy({
        by: ["status"],
        where,
        _count: true,
      }),
      prisma.outreach.groupBy({
        by: ["stage"],
        where,
        _count: true,
      }),
      prisma.outreach.count({
        where: { ...where, nextFollowUp: { not: null } },
      }),
    ]);

    res.json({
      total,
      byOutcome,
      byStage,
      needsFollowUp,
    });
  } catch (error) {
    console.error("[OUTREACH RECORDS] Error fetching stats:", error);
    res.status(500).json({ error: "Failed to fetch outreach statistics" });
  }
});

export default router;
