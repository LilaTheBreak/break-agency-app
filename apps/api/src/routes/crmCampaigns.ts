import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import prisma from "../lib/prisma.js";
import { logAdminActivity } from "../lib/adminActivityLogger.js";
import { logDestructiveAction, logAuditEvent } from "../lib/auditLogger.js";
import { logError } from "../lib/logger.js";
import { isAdmin, isSuperAdmin } from "../lib/roleHelpers.js";

const router = Router();

// All CRM routes require admin access
router.use(requireAuth);
router.use((req, res, next) => {
  if (!isAdmin(req.user!) && !isSuperAdmin(req.user!)) {
    return res.status(403).json({ error: "Forbidden: Admin access required" });
  }
  next();
});

/**
 * GET /api/crm-campaigns
 * List all campaigns with optional filters
 */
router.get("/", async (req, res) => {
  try {
    const { brandId, status, owner, talentId } = req.query;

    const where: any = {};
    if (brandId) where.brandId = brandId as string;
    if (status) where.status = status as string;
    if (owner) where.owner = owner as string;
    // Filter by talent if talentId provided (searches linkedTalentIds array)
    if (talentId) {
      where.linkedTalentIds = {
        has: talentId as string
      };
    }

    const campaigns = await prisma.crmCampaign.findMany({
      where,
      include: {
        Brand: {
          select: {
            id: true,
            name: true,
            
            
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // CRITICAL: Ensure we always return an array, never an empty string
    const safeCampaigns = Array.isArray(campaigns) ? campaigns : [];
    res.json(safeCampaigns);
  } catch (error) {
    // Phase 4: Fail loudly - no empty arrays on error
    logError("Failed to fetch campaigns", error, { userId: req.user?.id });
    return res.status(500).json({ 
      error: "Failed to fetch campaigns",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * GET /api/crm-campaigns/:id
 * Get single campaign with full details
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const campaign = await prisma.crmCampaign.findUnique({
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

    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    res.json(campaign);
  } catch (error) {
    console.error("Error fetching campaign:", error);
    res.status(500).json({ error: "Failed to fetch campaign" });
  }
});

/**
 * POST /api/crm-campaigns
 * Create a new campaign
 */
router.post("/", async (req, res) => {
  try {
    const {
      campaignName,
      brandId,
      campaignType,
      status = "Draft",
      startDate,
      endDate,
      internalSummary,
      goals,
      keyNotes,
      owner,
      linkedDealIds = [],
      linkedTalentIds = [],
      linkedTaskIds = [],
      linkedOutreachIds = [],
      linkedEventIds = [],
    } = req.body;

    if (!campaignName || !brandId) {
      return res.status(400).json({ error: "campaignName and brandId are required" });
    }

    const now = new Date();
    const campaign = await prisma.crmCampaign.create({
      data: {
        id: `campaign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        updatedAt: new Date(),
        campaignName,
        brandId,
        campaignType: campaignType || "Other",
        status,
        startDate: startDate || null,
        endDate: endDate || null,
        internalSummary: internalSummary || null,
        goals: goals || null,
        keyNotes: keyNotes || null,
        owner: owner || null,
        linkedDealIds,
        linkedTalentIds,
        linkedTaskIds,
        linkedOutreachIds,
        linkedEventIds,
        activity: [{ at: now.toISOString(), label: "Campaign created" }],
        lastActivityAt: now,
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
    try {
      await logAdminActivity(req as any, {
        event: "CRM_CAMPAIGN_CREATED",
        metadata: { campaignId: campaign.id, campaignName: campaign.campaignName, brandId: campaign.brandId }
      });
    } catch (logError) {
      console.error("Failed to log admin activity:", logError);
      // Don't fail the request if logging fails
    }

    res.status(201).json(campaign);
  } catch (error) {
    console.error("Error creating campaign:", error);
    res.status(500).json({ error: "Failed to create campaign" });
  }
});

/**
 * PATCH /api/crm-campaigns/:id
 * Update an existing campaign
 */
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      campaignName,
      campaignType,
      status,
      startDate,
      endDate,
      internalSummary,
      goals,
      keyNotes,
      owner,
      linkedDealIds,
      linkedTalentIds,
      linkedTaskIds,
      linkedOutreachIds,
      linkedEventIds,
    } = req.body;

    // Get current campaign to append to activity
    const existing = await prisma.crmCampaign.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    const now = new Date();
    const updateData: any = {
      updatedAt: now,
      lastActivityAt: now,
    };

    if (campaignName !== undefined) updateData.campaignName = campaignName;
    if (campaignType !== undefined) updateData.campaignType = campaignType;
    if (status !== undefined) updateData.status = status;
    if (startDate !== undefined) updateData.startDate = startDate || null;
    if (endDate !== undefined) updateData.endDate = endDate || null;
    if (internalSummary !== undefined) updateData.internalSummary = internalSummary || null;
    if (goals !== undefined) updateData.goals = goals || null;
    if (keyNotes !== undefined) updateData.keyNotes = keyNotes || null;
    if (owner !== undefined) updateData.owner = owner || null;
    if (linkedDealIds !== undefined) updateData.linkedDealIds = linkedDealIds;
    if (linkedTalentIds !== undefined) updateData.linkedTalentIds = linkedTalentIds;
    if (linkedTaskIds !== undefined) updateData.linkedTaskIds = linkedTaskIds;
    if (linkedOutreachIds !== undefined) updateData.linkedOutreachIds = linkedOutreachIds;
    if (linkedEventIds !== undefined) updateData.linkedEventIds = linkedEventIds;

    // Append to activity log
    const activityEntry = { at: now.toISOString(), label: "Campaign updated" };
    updateData.activity = [activityEntry, ...(existing.activity as any[])];

    const campaign = await prisma.crmCampaign.update({
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
          event: "CRM_CAMPAIGN_UPDATED",
          metadata: { campaignId: campaign.id, campaignName: campaign.campaignName, changes: Object.keys(updateData) }
        }),
        logAuditEvent(req as any, {
          action: "CAMPAIGN_UPDATED",
          entityType: "CrmCampaign",
          entityId: campaign.id,
          metadata: { campaignName: campaign.campaignName, changes: Object.keys(updateData) }
        })
      ]);
    } catch (logError) {
      console.error("Failed to log activity/audit:", logError);
      // Don't fail the request if logging fails
    }

    res.json(campaign);
  } catch (error) {
    console.error("Error updating campaign:", error);
    res.status(500).json({ error: "Failed to update campaign" });
  }
});

/**
 * DELETE /api/crm-campaigns/:id
 * Delete a campaign
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Get campaign info before deletion for logging
    const campaign = await prisma.crmCampaign.findUnique({ where: { id } });
    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    await prisma.crmCampaign.delete({
      where: { id },
    });

    // Phase 2: Log to AdminActivity for activity feed
    // Phase 4: Log destructive action
    try {
      await Promise.all([
        logAdminActivity(req as any, {
          event: "CRM_CAMPAIGN_DELETED",
          metadata: { campaignId: campaign.id, campaignName: campaign.campaignName }
        }),
        logDestructiveAction(req as any, {
          action: "CAMPAIGN_DELETED",
          entityType: "CrmCampaign",
          entityId: campaign.id,
          metadata: { campaignName: campaign.campaignName }
        })
      ]);
    } catch (logError) {
      console.error("Failed to log activity/audit:", logError);
      // Don't fail the request if logging fails
    }

    res.json({ success: true, message: "Campaign deleted" });
  } catch (error) {
    // Phase 4: Fail loudly
    logError("Failed to delete campaign", error, { campaignId: req.params.id, userId: req.user?.id });
    res.status(500).json({ 
      error: "Failed to delete campaign",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * POST /api/crm-campaigns/batch-import
 * Import campaigns from localStorage (migration endpoint)
 */
router.post("/batch-import", async (req, res) => {
  try {
    const { campaigns } = req.body;

    if (!Array.isArray(campaigns)) {
      return res.status(400).json({ error: "campaigns must be an array" });
    }

    const imported = {
      campaigns: 0,
    };

    for (const campaign of campaigns) {
      try {
        await prisma.crmCampaign.create({
          data: {
            id: `camp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            campaignName: campaign.campaignName,
            brandId: campaign.brandId,
            campaignType: campaign.campaignType || "Other",
            status: campaign.status || "Draft",
            startDate: campaign.startDate || null,
            endDate: campaign.endDate || null,
            internalSummary: campaign.internalSummary || null,
            goals: campaign.goals || null,
            keyNotes: campaign.keyNotes || null,
            owner: campaign.owner || null,
            linkedDealIds: campaign.linkedDealIds || [],
            linkedTalentIds: campaign.linkedTalentIds || [],
            linkedTaskIds: campaign.linkedTaskIds || [],
            linkedOutreachIds: campaign.linkedOutreachIds || [],
            linkedEventIds: campaign.linkedEventIds || [],
            activity: campaign.activity || [
              { at: new Date().toISOString(), label: "Campaign imported" },
            ],
            lastActivityAt: campaign.lastActivityAt
              ? new Date(campaign.lastActivityAt)
              : new Date(),
            updatedAt: new Date(),
          },
        });
        imported.campaigns++;
      } catch (error) {
        console.error(`Failed to import campaign ${campaign.id}:`, error);
      }
    }

    res.json({ success: true, imported });
  } catch (error) {
    console.error("Error importing campaigns:", error);
    res.status(500).json({ error: "Failed to import campaigns" });
  }
});

/**
 * POST /api/crm-campaigns/:id/link-deal
 * Link a deal to a campaign
 */
router.post("/:id/link-deal", async (req, res) => {
  try {
    const { id } = req.params;
    const { dealId, dealLabel } = req.body;

    if (!dealId) {
      return res.status(400).json({ error: "dealId is required" });
    }

    const campaign = await prisma.crmCampaign.findUnique({ where: { id } });
    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    const linkedDealIds = campaign.linkedDealIds as string[];
    if (!linkedDealIds.includes(dealId)) {
      linkedDealIds.push(dealId);
    }

    const now = new Date();
    const activityEntry = {
      at: now.toISOString(),
      label: `Deal added${dealLabel ? `: ${dealLabel}` : ""}`,
    };

    const updated = await prisma.crmCampaign.update({
      where: { id },
      data: {
        linkedDealIds,
        activity: [activityEntry, ...(campaign.activity as any[])],
        lastActivityAt: now,
        updatedAt: now,
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

    res.json(updated);
  } catch (error) {
    console.error("Error linking deal:", error);
    res.status(500).json({ error: "Failed to link deal" });
  }
});

/**
 * DELETE /api/crm-campaigns/:id/unlink-deal/:dealId
 * Unlink a deal from a campaign
 */
router.delete("/:id/unlink-deal/:dealId", async (req, res) => {
  try {
    const { id, dealId } = req.params;

    const campaign = await prisma.crmCampaign.findUnique({ where: { id } });
    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    const linkedDealIds = (campaign.linkedDealIds as string[]).filter((d) => d !== dealId);

    const updated = await prisma.crmCampaign.update({
      where: { id },
      data: {
        linkedDealIds,
        updatedAt: new Date(),
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

    res.json(updated);
  } catch (error) {
    console.error("Error unlinking deal:", error);
    res.status(500).json({ error: "Failed to unlink deal" });
  }
});

export default router;
