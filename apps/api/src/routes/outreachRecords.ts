import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import prisma from "../lib/prisma.js";

const router = Router();

// GET /api/outreach-records - Get all outreach records (with filters)
router.get("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const { brandId, contactId, dealId, outcome, channel, limit } = req.query;

    const where: any = {};
    if (brandId) where.brandId = String(brandId);
    if (contactId) where.contactId = String(contactId);
    if (dealId) where.dealId = String(dealId);
    if (outcome) where.outcome = String(outcome);
    if (channel) where.channel = String(channel);

    const records = await prisma.outreachRecord.findMany({
      where,
      include: {
        Brand: {
          select: {
            id: true,
            brandName: true,
            status: true,
            website: true,
          },
        },
        Contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            relationshipStatus: true,
            primaryContact: true,
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

    const record = await prisma.outreachRecord.findUnique({
      where: { id },
      include: {
        Brand: true,
        Contact: true,
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

    const record = await prisma.outreachRecord.create({
      data: {
        direction,
        channel,
        summary: summary.trim(),
        fullNotes: fullNotes?.trim() || null,
        brandId,
        contactId: contactId || null,
        dealId: dealId || null,
        campaignId: campaignId || null,
        talentId: talentId || null,
        outcome: outcome || "No reply yet",
        followUpSuggested: Boolean(followUpSuggested),
        followUpBy: followUpBy?.trim() || null,
        visibility: visibility || "Internal",
        createdBy: createdBy || "Admin",
      },
      include: {
        Brand: {
          select: {
            id: true,
            brandName: true,
            status: true,
            website: true,
          },
        },
        Contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            relationshipStatus: true,
            primaryContact: true,
          },
        },
      },
    });

    // Update contact's lastContactedAt if contactId provided
    if (contactId) {
      await prisma.crmContact.update({
        where: { id: contactId },
        data: { lastContactedAt: new Date() },
      });
    }

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

    const existing = await prisma.outreachRecord.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Outreach record not found" });
    }

    const record = await prisma.outreachRecord.update({
      where: { id },
      data: {
        direction: direction || existing.direction,
        channel: channel || existing.channel,
        summary: summary?.trim() || existing.summary,
        fullNotes: fullNotes !== undefined ? (fullNotes?.trim() || null) : existing.fullNotes,
        contactId: contactId !== undefined ? (contactId || null) : existing.contactId,
        dealId: dealId !== undefined ? (dealId || null) : existing.dealId,
        campaignId: campaignId !== undefined ? (campaignId || null) : existing.campaignId,
        talentId: talentId !== undefined ? (talentId || null) : existing.talentId,
        outcome: outcome || existing.outcome,
        followUpSuggested: followUpSuggested !== undefined ? Boolean(followUpSuggested) : existing.followUpSuggested,
        followUpBy: followUpBy !== undefined ? (followUpBy?.trim() || null) : existing.followUpBy,
        visibility: visibility || existing.visibility,
      },
      include: {
        Brand: {
          select: {
            id: true,
            brandName: true,
            status: true,
            website: true,
          },
        },
        Contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            relationshipStatus: true,
            primaryContact: true,
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

    await prisma.outreachRecord.delete({ where: { id } });

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

    const where = brandId ? { brandId: String(brandId) } : {};

    const [total, byOutcome, byChannel, needsFollowUp] = await Promise.all([
      prisma.outreachRecord.count({ where }),
      prisma.outreachRecord.groupBy({
        by: ["outcome"],
        where,
        _count: true,
      }),
      prisma.outreachRecord.groupBy({
        by: ["channel"],
        where,
        _count: true,
      }),
      prisma.outreachRecord.count({
        where: { ...where, followUpSuggested: true },
      }),
    ]);

    res.json({
      total,
      byOutcome,
      byChannel,
      needsFollowUp,
    });
  } catch (error) {
    console.error("[OUTREACH RECORDS] Error fetching stats:", error);
    res.status(500).json({ error: "Failed to fetch outreach statistics" });
  }
});

export default router;
