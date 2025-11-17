import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { SocialPlatform } from "@prisma/client";
import {
  connectSocialAccount,
  getSocialAnalyticsForUser,
  refreshSocialAnalytics
} from "../services/socialService.js";
import {
  getStatsForUser,
  getPostsForUser,
  refreshSocialIntegrations
} from "../services/socialIntegrationService.js";
import { logAuditEvent } from "../lib/auditLogger.js";
import { logAdminActivity } from "../lib/adminActivityLogger.js";

const router = Router();

const limiter = rateLimit({
  windowMs: 1000 * 60,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false
});

router.use(limiter);

const userParamSchema = z.object({ userId: z.string().min(1) });
const platformQuerySchema = z.object({ platform: z.nativeEnum(SocialPlatform).optional() });
const refreshBodySchema = z.object({ platform: z.nativeEnum(SocialPlatform).optional() });

router.post("/social/connect/:platform", async (req, res) => {
  try {
    const platform = parsePlatform(req.params.platform);
    const { code, redirectUri, userId } = req.body ?? {};
    if (!code || !redirectUri || !userId) {
      return res.status(400).json({ error: "code, redirectUri, and userId are required" });
    }
    const account = await connectSocialAccount({
      userId,
      platform,
      code,
      redirectUri
    });
    await logAuditEvent(req, {
      action: "social.connect",
      entityType: "social",
      entityId: userId,
      metadata: { platform }
    });
    await logAdminActivity(req, {
      event: "admin.social.connect",
      metadata: { platform, userId }
    });
    res.json({ account });
  } catch (error) {
    console.error("social connect error", error);
    res.status(500).json({ error: "Failed to connect social account" });
  }
});

router.get("/social/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }
    const data = await getSocialAnalyticsForUser(userId);
    res.json(data);
  } catch (error) {
    console.error("social fetch error", error);
    res.status(500).json({ error: "Failed to load social analytics" });
  }
});

router.get("/social/:userId/refresh", async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }
    const platforms = req.query.platforms
      ? String(req.query.platforms)
          .split(",")
          .map((value) => parsePlatform(value))
      : undefined;
    const data = await refreshSocialAnalytics({ userId, platforms });
    res.json(data);
  } catch (error) {
    console.error("social refresh error", error);
    res.status(500).json({ error: "Failed to refresh social analytics" });
  }
});

router.get("/social/stats/:userId", async (req, res) => {
  try {
    const { userId } = userParamSchema.parse(req.params);
    const { platform } = platformQuerySchema.parse({
      platform: req.query.platform ? String(req.query.platform).toUpperCase() : undefined
    });
    const stats = await getStatsForUser(userId, platform);
    res.json({ stats });
  } catch (error) {
    console.error("social stats error", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.flatten() });
    }
    res.status(500).json({ error: "Failed to load social stats" });
  }
});

router.get("/social/posts/:userId", async (req, res) => {
  try {
    const { userId } = userParamSchema.parse(req.params);
    const { platform } = platformQuerySchema.parse({
      platform: req.query.platform ? String(req.query.platform).toUpperCase() : undefined
    });
    const posts = await getPostsForUser(userId, platform);
    res.json({ posts });
  } catch (error) {
    console.error("social posts error", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.flatten() });
    }
    res.status(500).json({ error: "Failed to load social posts" });
  }
});

router.post("/social/refresh/:userId", async (req, res) => {
  try {
    const { userId } = userParamSchema.parse(req.params);
    const body = refreshBodySchema.parse(
      req.body?.platform
        ? { platform: String(req.body.platform).toUpperCase() }
        : { platform: undefined }
    );
    const result = await refreshSocialIntegrations(userId, body.platform);
    res.json({ refreshed: result });
  } catch (error) {
    console.error("social integration refresh error", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.flatten() });
    }
    res.status(500).json({ error: error instanceof Error ? error.message : "Failed to refresh token" });
  }
});

function parsePlatform(value: string): SocialPlatform {
  const cleaned = value?.toUpperCase();
  if (!cleaned || !(cleaned in SocialPlatform)) {
    throw new Error(`Unsupported platform ${value}`);
  }
  return cleaned as SocialPlatform;
}

export default router;
