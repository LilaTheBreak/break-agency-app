import { Prisma } from "@prisma/client";
import { Router, Request, Response, NextFunction } from "express";
import prisma from "../lib/prisma.js";
import { SessionUser } from "../lib/session.js"; // Import SessionUser type
import { z } from "zod";
import { isSuperAdmin, isAdmin, isManager } from "../lib/roleHelpers.js";
import { logError } from "../lib/logger.js";
import { sendSuccess, sendList, sendEmptyList } from "../utils/apiResponse.js";

const router = Router();

/**
 * POST /campaigns
 * Creates a new BrandCampaign.
 */
router.post("/campaigns", ensureManager, async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validation = validateRequestSafe(CampaignCreateSchema, req.body);
    if (!validation.success) {
      return sendError(res, "VALIDATION_ERROR", "Invalid request data", 400, validation.error.format());
    }

    const { title, ownerId, stage = "PLANNING", brands = [], creatorTeams = [], metadata = {} } = validation.data;
    
    if (!req.user?.id) {
      return sendError(res, "UNAUTHORIZED", "Authentication required", 401);
    }
    
    const userId = req.user.id;
    const normalizedStage = normalizeStage(stage);
    
    const campaign = await prisma.brandCampaign.create({
      data: {
        title,
        ownerId: ownerId || userId,
        stage: normalizedStage,
        brands: sanitize(brands),
        creatorTeams: sanitize(creatorTeams),
        metadata: sanitize(metadata)
      }
    });
    await syncBrandPivots(campaign.id, Array.isArray(brands) ? brands : []);
    const payload = await fetchCampaign(campaign.id, userId);
    sendSuccess(res, { campaign: payload }, 201);
  } catch (error) {
    logError("Failed to create campaign", error, { userId: req.user?.id });
    Sentry.captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { route: '/campaigns', method: 'POST' },
    });
    handleApiError(res, error, 'Failed to create campaign', 'CAMPAIGN_CREATE_FAILED');
  }
});

/**
 * POST /campaigns/:id/addBrand
 * Adds a brand to an existing campaign.
 */
router.post("/campaigns/:id/addBrand", ensureManager, async (req: Request, res: Response) => {
  const campaignId = req.params.id;
  const { brand } = req.body ?? {};
  if (!brand || typeof brand !== "object") {
    return res.status(400).json({ error: "Brand payload required" });
  }
  try {
    const campaign = await prisma.brandCampaign.findUnique({ where: { id: campaignId } });
    if (!campaign) return res.status(404).json({ error: "Campaign not found" });
    const brands = Array.isArray(campaign.brands) ? campaign.brands : [];
    brands.push(brand);
    await prisma.brandCampaign.update({
      where: { id: campaignId },
      data: { brands }
    });
    await syncBrandPivots(campaignId, [brand]);
    const payload = await fetchCampaign(campaignId, req.user!.id);
    res.json({ campaign: payload });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Unable to add brand" });
  }
});

/**
 * GET /campaigns/user/:userId
 * Fetches campaigns associated with a specific user (or all for admins).
 * NOTE: This MUST come BEFORE /campaigns/:id to avoid "user" being treated as an ID
 */
router.get("/campaigns/user/:userId", ensureUser, async (req: Request, res: Response) => {
  try {
    const requester = req.user!;
    let targetId = req.params.userId;
    
    if (targetId === "me") targetId = requester.id;
    
    // Non-admin users requesting 'all' get empty array (graceful degradation)
    if (targetId === "all" && !isAdmin(requester)) {
      logError("Failed to fetch campaigns", error, { userId: req.user?.id });
      return res.status(500).json({ 
        error: "Failed to fetch campaigns",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
    
    // Build where clause
    const whereClause =
      targetId === "all"
        ? {}
        : {
            OR: [{ ownerId: targetId }, { CampaignBrandPivot: { some: { brandId: targetId } } }]
          };
    
    // Fetch campaigns
    const campaigns = await prisma.brandCampaign.findMany({
      where: whereClause,
      include: { 
        CampaignBrandPivot: true 
      },
      orderBy: { createdAt: "desc" },
      take: 25
    });
    
    // Format and return
    const formatted = campaigns.map((campaign) => formatCampaign(campaign));
    sendList(res, formatted || []);
  } catch (error) {
    // Always return empty list on error - never crash dashboard
    logError("Failed to fetch campaigns", error, { userId: req.user?.id, targetId });
    sendEmptyList(res);
  }
});

/**
 * GET /campaigns/:id
 * Fetches a single campaign by its ID.
 * NOTE: This MUST come AFTER /campaigns/user/:userId to avoid route conflicts
 */
router.get("/campaigns/:id", ensureUser, async (req: Request, res: Response) => {
  try {
    const campaign = await fetchCampaign(req.params.id, req.user!.id);
    if (!campaign) return res.status(404).json({ error: "Campaign not found" });
    if (!canAccessCampaign(campaign, req.user!.id, req.user!.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    res.json({ campaign });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Unable to load campaign" });
  }
});

const CampaignUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  stage: z.enum(["PLANNING", "ACTIVE", "REVIEW", "COMPLETE"]).optional(),
  brands: z.array(z.any()).optional(), // Loosely typed for now, can be refined
  creatorTeams: z.array(z.any()).optional(), // Loosely typed for now, can be refined
  metadata: z.record(z.any()).optional(), // Loosely typed for now
});

/**
 * PUT /campaigns/:id
 * Updates an existing BrandCampaign.
 */
router.put("/campaigns/:id", ensureManager, async (req: Request, res: Response) => {
  try {
    const campaignId = req.params.id;
    
    // Validate request body (using existing schema validation)
    const parsed = CampaignUpdateSchema.safeParse(req.body);

    if (!parsed.success) {
      return sendError(res, "VALIDATION_ERROR", "Invalid request data", 400, parsed.error.format());
    }

    const updatedCampaign = await prisma.brandCampaign.update({
      where: { id: campaignId },
      data: {
        title: parsed.data.title,
        stage: parsed.data.stage ? normalizeStage(parsed.data.stage) : undefined,
        brands: parsed.data.brands ? sanitize(parsed.data.brands) : undefined,
        creatorTeams: parsed.data.creatorTeams ? sanitize(parsed.data.creatorTeams) : undefined,
        metadata: parsed.data.metadata ? sanitize(parsed.data.metadata) : undefined,
      },
    });
    // Re-sync brand pivots if brands were updated
    if (parsed.data.brands) await syncBrandPivots(campaignId, parsed.data.brands);
    sendSuccess(res, { campaign: formatCampaign(updatedCampaign) });
  } catch (error) {
    logError("Failed to update campaign", error, { userId: req.user?.id, campaignId: req.params.id });
    Sentry.captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { route: '/campaigns/:id', method: 'PUT' },
    });
    handleApiError(res, error, 'Failed to update campaign', 'CAMPAIGN_UPDATE_FAILED');
  }
});

async function fetchCampaign(id: string, requesterId: string) {
  const campaign = await prisma.brandCampaign.findUnique({
    where: { id },
    include: { CampaignBrandPivot: true }
  });
  if (!campaign) return null;
  return formatCampaign(campaign);
}

async function syncBrandPivots(campaignId: string, brands: any[]) {
  if (!Array.isArray(brands) || !brands.length) return;
  const entries = brands
    .map((brand) => ({
      brandId: String(brand.id || brand.email || brand.name || `brand-${Date.now()}`),
      metrics: {
        reach: Number(brand.reach ?? brand.metrics?.reach ?? 0),
        revenue: Number(brand.revenue ?? brand.metrics?.revenue ?? 0),
        pacing: Number(brand.pacing ?? brand.metrics?.pacing ?? 0),
        opportunities: brand.opportunities ?? brand.metrics?.opportunities ?? [],
        matches: brand.matches ?? brand.creatorMatches ?? []
      }
    }))
    .filter((entry) => entry.brandId);
  if (!entries.length) return;
  await prisma.campaignBrandPivot.createMany({
    data: entries.map((entry) => ({
      campaignId,
      brandId: entry.brandId,
      metrics: entry.metrics as Prisma.InputJsonValue
    }))
  });
}

function formatCampaign(campaign: any) {
  const brandEntries = Array.isArray(campaign.brands) ? campaign.brands : [];
  const pivotEntries = (campaign.CampaignBrandPivot || []).map((pivot) => ({
    id: pivot.brandId,
    metrics: pivot.metrics || {}
  }));
  const summaryMap = new Map();
  for (const entry of brandEntries) {
    const id = entry.id || entry.email || entry.name || `brand-${summaryMap.size + 1}`;
    summaryMap.set(id, {
      id,
      name: entry.name || entry.label || id,
      reach: Number(entry.reach ?? 0),
      revenue: Number(entry.revenue ?? 0),
      pacing: Number(entry.pacing ?? 0),
      opportunities: entry.opportunities ?? [],
      matches: entry.matches ?? entry.creatorMatches ?? []
    });
  }
  for (const pivot of pivotEntries) {
    const existing = summaryMap.get(pivot.id) || {
      id: pivot.id,
      name: pivot.id,
      reach: 0,
      revenue: 0,
      pacing: 0,
      opportunities: [],
      matches: []
    };
    summaryMap.set(pivot.id, {
      ...existing,
      reach: Number(pivot.metrics?.reach ?? existing.reach ?? 0),
      revenue: Number(pivot.metrics?.revenue ?? existing.revenue ?? 0),
      pacing: Number(pivot.metrics?.pacing ?? existing.pacing ?? 0),
      opportunities: pivot.metrics?.opportunities || existing.opportunities || [],
      matches: pivot.metrics?.matches || existing.matches || []
    });
  }
  const brandSummaries = Array.from(summaryMap.values());
  const totalReach = brandSummaries.reduce((sum, brand) => sum + (brand.reach || 0), 0);
  const revenuePerBrand = brandSummaries.reduce((acc, brand) => {
    acc[brand.name] = brand.revenue || 0;
    return acc;
  }, {} as Record<string, number>);
  const pacingPerBrand = brandSummaries.reduce((acc, brand) => {
    acc[brand.name] = brand.pacing || 0;
    return acc;
  }, {} as Record<string, number>);
  return {
    ...campaign,
    brandSummaries,
    aggregated: {
      totalReach,
      revenuePerBrand,
      pacingPerBrand
    }
  };
}

function ensureUser(req: Request, res: Response, next: NextFunction) {
  if (!req.user?.id) return res.status(401).json({ error: "Authentication required" });
  next();
}

function ensureManager(req: Request, res: Response, next: NextFunction) {
  if (!req.user?.id) return res.status(401).json({ error: "Authentication required" });
  // CRITICAL: Superadmin bypasses manager check
  if (isSuperAdmin(req.user)) return next();
  if (!isManager(req.user)) return res.status(403).json({ error: "Insufficient permissions" });
  next();
}

// Removed isManager, isAdmin helpers - now using centralized roleHelpers.ts

function canAccessCampaign(campaign: any, userId: string, userRole: string) {
  // Use centralized helper - superadmin is already handled in isAdmin
  if (isAdmin({ role: userRole })) return true;
  if (campaign.ownerId && campaign.ownerId === userId) return true;
  if (campaign.brandSummaries?.some((brand: any) => brand.id === userId)) return true;
  return false;
}

function normalizeStage(stage: string) {
  const upper = String(stage || "").toUpperCase();
  return ["PLANNING", "ACTIVE", "REVIEW", "COMPLETE"].includes(upper) ? upper : "PLANNING";
}

function sanitize(data: unknown): Prisma.InputJsonValue {
  try {
    return JSON.parse(JSON.stringify(data ?? {})) as Prisma.InputJsonValue;
  } catch {
    return (data ?? null) as Prisma.InputJsonValue;
  }
}

export default router;
