import { Prisma } from "@prisma/client";
import { Router, Request, Response, NextFunction } from "express";
import prisma from "../lib/prisma.js";
import { SessionUser } from "../lib/session.js"; // Import SessionUser type
import { z } from "zod";

const router = Router();

/**
 * POST /campaigns
 * Creates a new BrandCampaign.
 */
router.post("/campaigns", ensureManager, async (req: Request, res: Response) => {
  const { title, ownerId, stage = "PLANNING", brands = [], creatorTeams = [], metadata = {} } = req.body ?? {};
  if (!title) {
    return res.status(400).json({ error: "Title is required" });
  }
  if (!req.user?.id) {
    return res.status(401).json({ error: "Authentication required" });
  }
  const userId = req.user.id;
  const normalizedStage = normalizeStage(stage);
  try {
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
    res.status(201).json({ campaign: payload });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Unable to create campaign" });
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
 * GET /campaigns/:id
 * Fetches a single campaign by its ID.
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

/**
 * GET /campaigns/user/:userId
 * Fetches campaigns associated with a specific user (or all for admins).
 */
router.get("/campaigns/user/:userId", ensureUser, async (req: Request, res: Response) => {
  const requester = req.user!;
  let targetId = req.params.userId;
  if (targetId === "me") targetId = requester.id;
  if (targetId === "all" && !isAdmin(requester)) {
    // Return empty array instead of 403 - allow graceful degradation
    return res.status(200).json({ campaigns: [] });
  }
  const whereClause =
    targetId === "all"
      ? {}
      : {
          OR: [{ ownerId: targetId }, { brandLinks: { some: { brandId: targetId } } }]
        };
  try {
    const campaigns = await prisma.brandCampaign.findMany({
      where: whereClause,
      include: { brandLinks: true },
      orderBy: { createdAt: "desc" },
      take: 25
    });
    const formatted = campaigns.map((campaign) => formatCampaign(campaign));
    res.json({ campaigns: formatted });
  } catch (error) {
    console.error("Campaigns fetch error:", error);
    // Return empty array on error - don't crash dashboard
    res.status(200).json({ campaigns: [] });
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
  const campaignId = req.params.id;
  const parsed = CampaignUpdateSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload.", details: parsed.error.flatten() });
  }

  try {
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
    res.json({ campaign: formatCampaign(updatedCampaign) });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Unable to update campaign" });
  }
});

async function fetchCampaign(id: string, requesterId: string) {
  const campaign = await prisma.brandCampaign.findUnique({
    where: { id },
    include: { brandLinks: true }
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
  const pivotEntries = (campaign.brandLinks || []).map((pivot) => ({
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
  if (!isManager(req.user)) return res.status(403).json({ error: "Insufficient permissions" });
  next();
}

function isManager(user: SessionUser) {
  // Use single role field from User model
  return ["ADMIN", "SUPERADMIN", "AGENT", "BRAND"].includes(user.role);
}

function isAdmin(user: SessionUser) {
  // Use single role field from User model
  return user.role === "ADMIN" || user.role === "SUPERADMIN";
}

function canAccessCampaign(campaign: any, userId: string, userRole: string) {
  // Use single role field from User model
  if (userRole === "ADMIN" || userRole === "SUPERADMIN") return true;
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
