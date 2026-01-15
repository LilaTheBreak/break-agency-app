import { Router, Request, Response } from "express";
import prisma from '../../lib/prisma.js';
import { getTalentSocialIntelligence } from '../../services/socialIntelligenceService.js';
import {
  normalizeSocialInput,
  syncExternalProfile,
} from '../../services/analyticsIngestionService.js';
import { logError, logInfo } from '../../lib/logger.js';

const router = Router();

/**
 * POST /api/admin/analytics/analyze
 * 
 * Analyze ANY social profile (connected or external)
 * Accepts:
 * - talentId: Analyze a talent's connected profiles
 * - url or handle: Paste URL or @handle for analysis
 * 
 * Returns full analytics data with sync status
 */
router.post("/analyze", async (req: Request, res: Response) => {
  try {
    const { talentId, url, forceRefresh } = req.body;

    logInfo("[ANALYTICS] Analyze request", { talentId, url, forceRefresh });

    // Case 1: Analyze talent
    if (talentId && typeof talentId === "string") {
      try {
        // Check if talent exists first
        const talent = await prisma.talent.findUnique({
          where: { id: talentId },
        });
        
        if (!talent) {
          logInfo("[ANALYTICS] Talent not found", { talentId });
          return res.status(404).json({
            error: "Talent not found",
            details: `No talent found with ID: ${talentId}`,
          });
        }
        
        const talentData = await getTalentSocialIntelligence(talentId);
        logInfo("[ANALYTICS] Talent analytics fetched", { talentId });
        return res.json({
          ...talentData,
          syncStatus: "idle",
          updatedAt: new Date(),
        });
      } catch (err) {
        logError("[ANALYTICS] Error fetching talent analytics", err, { talentId });
        return res.status(500).json({
          error: "Failed to fetch talent analytics",
          details: err instanceof Error ? err.message : String(err),
        });
      }
    }

    // Case 2: Analyze external profile from URL/handle
    if (url && typeof url === "string") {
      // Normalize input
      const normalized = normalizeSocialInput(url);

      if (!normalized.isValid) {
        logInfo("[ANALYTICS] Invalid input", { url, error: normalized.error });
        return res.status(400).json({
          error: "Invalid social profile input",
          details: normalized.error,
        });
      }

      // Sync profile and get fresh data
      const syncResult = await syncExternalProfile(normalized, {
        forceRefresh: forceRefresh === true,
        maxAge: 12,
      });

      if (!syncResult.profile) {
        logInfo("[ANALYTICS] Sync failed", {
          platform: normalized.platform,
          username: normalized.username,
          error: syncResult.error,
        });
        return res.status(404).json({
          error: "Could not fetch profile data",
          details: syncResult.error,
          platform: normalized.platform,
          username: normalized.username,
        });
      }

      // Build analytics response from external profile
      const analytics = buildAnalyticsFromExternalProfile(syncResult.profile);
      logInfo("[ANALYTICS] Analytics response built", {
        platform: normalized.platform,
        username: normalized.username,
        cached: syncResult.cached,
      });

      return res.json({
        ...analytics,
        syncStatus: syncResult.cached ? "cached" : "synced",
        updatedAt: syncResult.profile.lastFetchedAt,
      });
    }

    return res.status(400).json({
      error: "Missing required parameters",
      details: "Provide either talentId or url",
    });
  } catch (error) {
    logError("[ANALYTICS] Analyze request failed", error, {
      userId: (req as any).user?.id,
    });
    return res.status(500).json({
      error: "Failed to analyze profile",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * GET /api/admin/analytics
 * 
 * Legacy endpoint - redirects to POST /analyze
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const { talentId, profileId, url } = req.query;

    logInfo("[ANALYTICS] GET request", { talentId, profileId, url });

    // Case 1: Analyze talent by ID
    if (talentId && typeof talentId === "string") {
      try {
        // Check if talent exists first
        const talent = await prisma.talent.findUnique({
          where: { id: talentId },
        });
        
        if (!talent) {
          logInfo("[ANALYTICS] Talent not found", { talentId });
          return res.status(404).json({
            error: "Talent not found",
            details: `No talent found with ID: ${talentId}`,
          });
        }
        
        const talentData = await getTalentSocialIntelligence(talentId);
        logInfo("[ANALYTICS] Talent analytics fetched", { talentId });
        return res.json({
          ...talentData,
          syncStatus: "idle",
          updatedAt: new Date(),
        });
      } catch (err) {
        logError("[ANALYTICS] Error fetching talent analytics", err, { talentId });
        return res.status(500).json({ error: "Failed to fetch talent analytics" });
      }
    }

    // Case 2: Analyze connected profile by ID (legacy support)
    if (profileId && typeof profileId === "string") {
      try {
        // For connected profiles, fetch from ExternalSocialProfile
        const profile = await prisma.externalSocialProfile.findUnique({
          where: { id: profileId },
        });

        if (!profile) {
          return res.status(404).json({
            error: "Profile not found",
            profileId,
          });
        }

        const analytics = buildAnalyticsFromExternalProfile(profile);
        logInfo("[ANALYTICS] Connected profile analytics fetched", { profileId });
        return res.json({
          ...analytics,
          syncStatus: "idle",
          updatedAt: profile.lastFetchedAt || new Date(),
        });
      } catch (err) {
        logError("[ANALYTICS] Error fetching connected profile analytics", err, { profileId });
        return res.status(500).json({ error: "Failed to fetch profile analytics" });
      }
    }

    // Case 3: Analyze external URL
    if (url && typeof url === "string") {
      const normalized = normalizeSocialInput(url);

      if (!normalized.isValid) {
        return res.status(400).json({
          error: "Invalid social profile input",
          details: normalized.error,
        });
      }

      const syncResult = await syncExternalProfile(normalized, { maxAge: 12 });

      if (!syncResult.profile) {
        return res.status(404).json({
          error: "Could not fetch profile data",
          details: syncResult.error,
        });
      }

      const analytics = buildAnalyticsFromExternalProfile(syncResult.profile);
      return res.json({
        ...analytics,
        syncStatus: syncResult.cached ? "cached" : "synced",
        updatedAt: syncResult.profile.lastFetchedAt,
      });
    }

    return res.status(400).json({ error: "Missing required parameters" });
  } catch (error) {
    logError("[ANALYTICS] Failed to fetch analytics", error, {
      userId: (req as any).user?.id,
    });
    return res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

/**
 * POST /api/admin/analytics/refresh
 * 
 * Manually refresh cached data for a profile
 * Clears cache and fetches fresh data
 */
router.post("/refresh", async (req: Request, res: Response) => {
  try {
    const { url } = req.body;

    if (!url || typeof url !== "string") {
      return res.status(400).json({
        error: "URL is required",
      });
    }

    logInfo("[ANALYTICS] Manual refresh requested", { url: url.substring(0, 50) });

    const normalized = normalizeSocialInput(url);

    if (!normalized.isValid) {
      return res.status(400).json({
        error: "Invalid social profile input",
        details: normalized.error,
      });
    }

    // Force refresh (ignore cache)
    const syncResult = await syncExternalProfile(normalized, {
      forceRefresh: true,
    });

    if (!syncResult.profile) {
      logInfo("[ANALYTICS] Refresh failed", {
        platform: normalized.platform,
        username: normalized.username,
        error: syncResult.error,
      });
      return res.status(404).json({
        error: "Could not refresh profile data",
        details: syncResult.error,
      });
    }

    const analytics = buildAnalyticsFromExternalProfile(syncResult.profile);
    logInfo("[ANALYTICS] Refresh completed", {
      platform: normalized.platform,
      username: normalized.username,
    });

    return res.json({
      ...analytics,
      syncStatus: "synced",
      updatedAt: syncResult.profile.lastFetchedAt,
      refreshedAt: new Date(),
    });
  } catch (error) {
    logError("[ANALYTICS] Refresh failed", error, {
      userId: (req as any).user?.id,
    });
    return res.status(500).json({
      error: "Failed to refresh profile",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

router.get("/connected-profiles", async (req: Request, res: Response) => {
  try {
    const profiles = await prisma.socialProfile.findMany({
      select: {
        id: true,
        platform: true,
        handle: true,
        displayName: true,
        followerCount: true,
        engagementRate: true,
        postCount: true,
      },
      orderBy: { followerCount: "desc" },
      take: 100,
    });

    return res.json({ profiles, count: profiles.length });
  } catch (error) {
    logError("Failed to fetch connected profiles", error, {
      userId: (req as any).user?.id,
    });
    return res.status(500).json({ error: "Failed to fetch connected profiles" });
  }
});

/**
 * POST /api/admin/talent/:talentId/analytics-notes
 * Save admin notes for a talent's analytics
 */
router.post("/:talentId/analytics-notes", async (req: Request, res: Response) => {
  try {
    const { talentId } = req.params;
    const { notes } = req.body;

    if (!talentId) {
      return res.status(400).json({ error: "Talent ID is required" });
    }

    // Verify talent exists
    const talent = await prisma.talent.findUnique({
      where: { id: talentId },
    });

    if (!talent) {
      return res.status(404).json({ error: "Talent not found" });
    }

    // Save notes to the existing notes field
    const updated = await prisma.talent.update({
      where: { id: talentId },
      data: {
        notes: notes ? `${notes}` : null,
      },
    });

    return res.json({ notes: updated.notes, success: true });
  } catch (error) {
    logError("Failed to save analytics notes", error, {
      userId: (req as any).user?.id,
      talentId: req.params.talentId,
    });
    return res.status(500).json({ error: "Failed to save notes" });
  }
});

/**
 * POST /api/admin/talent/:talentId/comparison-notes
 * Save comparison notes between two profiles
 */
router.post("/:talentId/comparison-notes", async (req: Request, res: Response) => {
  try {
    const { talentId } = req.params;
    const { notes, comparedWithId } = req.body;

    if (!talentId) {
      return res.status(400).json({ error: "Talent ID is required" });
    }

    // Verify talent exists
    const talent = await prisma.talent.findUnique({
      where: { id: talentId },
    });

    if (!talent) {
      return res.status(404).json({ error: "Talent not found" });
    }

    // Save comparison notes as JSON in notes field
    const comparisonData = {
      comparedWithId,
      notes,
      createdAt: new Date().toISOString(),
    };

    const updated = await prisma.talent.update({
      where: { id: talentId },
      data: {
        notes: JSON.stringify(comparisonData),
      },
    });

    return res.json({ comparisonNotes: comparisonData, success: true });
  } catch (error) {
    logError("Failed to save comparison notes", error, {
      userId: (req as any).user?.id,
      talentId: req.params.talentId,
    });
    return res.status(500).json({ error: "Failed to save comparison notes" });
  }
});

/**
 * Build empty analytics for external profiles not yet in database
 */
function buildEmptyAnalytics(handle: string, platform: string) {
  return {
    connected: false,
    platforms: [platform],
    overview: {
      totalReach: 0,
      engagementRate: "—",
      followerGrowth: 0,
      postCount: 0,
      avgPostsPerWeek: 0,
      topPlatform: platform,
      topPlatformFollowers: 0,
      sentimentScore: 0,
      consistencyScore: 0,
    },
    contentPerformance: [],
    keywords: [],
    community: {
      commentVolume: 0,
      commentTrend: 0,
      responseRate: 0,
      responseTrend: 0,
      averageSentiment: 0,
      consistencyScore: 0,
      alerts: ["No data available - profile not yet synced"],
    },
    paidContent: [],
    notes: "",
    updatedAt: new Date(),
  };
}

/**
 * Build analytics object from profile data
 */
async function buildAnalyticsFromProfile(profile: any, dateRange?: string | null): Promise<any> {
  // Filter posts by date range
  let filteredPosts = (profile.posts || []) as any[];

  if (dateRange && dateRange !== "custom" && dateRange !== "null") {
    const days =
      dateRange === "7d"
        ? 7
        : dateRange === "30d"
        ? 30
        : dateRange === "90d"
        ? 90
        : 30;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    filteredPosts = filteredPosts.filter(
      (p: any) => p.postedAt && new Date(p.postedAt) >= startDate
    );
  }

  // Calculate metrics
  const totalEngagements = filteredPosts.reduce(
    (sum: number, p: any) => sum + (p.likeCount || 0) + (p.commentCount || 0),
    0
  );

  const avgEngagementRate = filteredPosts.length && profile.followerCount > 0
    ? ((totalEngagements / filteredPosts.length) / profile.followerCount) * 100
    : 0;

  // Build analytics response
  return {
    connected: true,
    platforms: [profile.platform],
    overview: {
      totalReach: totalEngagements,
      engagementRate: Math.min(Math.max(avgEngagementRate, 0), 100).toFixed(2),
      followerGrowth: 0,
      postCount: filteredPosts.length,
      avgPostsPerWeek: (filteredPosts.length / 4).toFixed(1),
      topPlatform: profile.platform,
      topPlatformFollowers: profile.followerCount,
      sentimentScore: 0.75,
      consistencyScore: 0.7,
    },
    contentPerformance: filteredPosts.slice(0, 8).map((p: any) => ({
      id: p.id,
      platform: profile.platform,
      caption: p.caption || "",
      contentType: p.contentType || "POST",
      engagementRate: p.engagementRate || 0,
      likeCount: p.likeCount || 0,
      commentCount: p.commentCount || 0,
      saveCount: p.saveCount || 0,
      watchTime: p.watchTime || 0,
      postedAt: p.postedAt,
    })),
    keywords: [
      { term: "engagement", frequency: 3, category: "core" },
      { term: "content", frequency: 2, category: "core" },
      { term: "growth", frequency: 2, category: "emerging" },
    ],
    community: {
      commentVolume: filteredPosts.reduce((sum: number, p: any) => sum + (p.commentCount || 0), 0),
      commentTrend: 0.05,
      responseRate: 0.65,
      responseTrend: 0.1,
      averageSentiment: 0.75,
      consistencyScore: 0.7,
      alerts: [],
    },
    paidContent: [],
    notes: "",
    updatedAt: new Date(),
  };
}

/**
 * Build analytics from external social profile (snapshot-based)
 */
/**
 * Metric response structure for all analytics
 * Ensures consistency and explainability across all sections
 */
interface MetricResponse {
  value: number | string | null;
  status: "measured" | "estimated" | "unavailable";
  explanation: string;
  source: "scrape" | "cache" | "inferred";
}

function wrapMetric(
  value: number | string | null,
  status: "measured" | "estimated" | "unavailable",
  explanation: string,
  source: "scrape" | "cache" | "inferred"
): MetricResponse {
  return { value, status, explanation, source };
}

function buildAnalyticsFromExternalProfile(profile: any): any {
  const snapshot = profile.snapshotJson
    ? JSON.parse(profile.snapshotJson)
    : {};

  const followerCount = snapshot.followerCount || snapshot.subscriberCount || 0;
  const engagementRate = snapshot.engagementRate || 0;
  const postCount = snapshot.videoCount || snapshot.postCount || 0;

  // Determine follower count status and source based on what data we have
  let followerStatus: "measured" | "estimated" | "unavailable" = "unavailable";
  let followerSource: "scrape" | "cache" | "inferred" = "inferred";
  let followerExplanation = "Instagram restricts automated access to follower counts";

  if (followerCount > 0) {
    // We have actual data - determine if it's from cache or fresh scrape
    if (snapshot.dataSource === "SCRAPE" || snapshot.dataSource === "cache") {
      followerStatus = "estimated";
      followerExplanation = "Estimated from publicly available profile metadata";
      followerSource = "scrape";
    } else if (profile.updatedAt && new Date(profile.updatedAt).getTime() > Date.now() - (12 * 60 * 60 * 1000)) {
      // Recent update - treat as cached estimate
      followerStatus = "estimated";
      followerExplanation = "Previously captured public follower count (cached)";
      followerSource = "cache";
    }
  }

  return {
    connected: false,
    platform: profile.platform,
    username: profile.username,
    dataSource: "external",
    profileUrl: profile.url || `https://${profile.platform.toLowerCase()}.com/${profile.username}`,
    
    overview: {
      totalReach: wrapMetric(
        followerCount > 0 ? followerCount : null,
        followerStatus,
        followerExplanation,
        followerSource
      ),
      
      engagementRate: wrapMetric(
        engagementRate > 0 ? Number(engagementRate.toFixed(2)) : null,
        engagementRate > 0 ? "estimated" : "unavailable",
        "Calculated as (likes + comments) ÷ followers from recent posts",
        "inferred"
      ),
      
      followerGrowth: wrapMetric(
        null,
        "unavailable",
        "Historical data not available for external profiles",
        "scrape"
      ),
      
      postCount: wrapMetric(
        postCount > 0 ? postCount : null,
        postCount > 0 ? "measured" : "unavailable",
        "Total number of public posts visible on profile",
        "scrape"
      ),
      
      avgPostsPerWeek: wrapMetric(
        null,
        "estimated",
        "Requires historical posting data not available for external profiles",
        "scrape"
      ),
      
      topPlatform: wrapMetric(
        profile.platform,
        "measured",
        "Platform selected by user",
        "cache"
      ),
      
      topPlatformFollowers: wrapMetric(
        followerCount > 0 ? followerCount : null,
        followerStatus,
        followerExplanation,
        followerSource
      ),
      
      sentimentScore: wrapMetric(
        null,
        "estimated",
        "Sentiment estimation from public comments requires NLP processing. Limited accuracy for non-business accounts.",
        "inferred"
      ),
      
      consistencyScore: wrapMetric(
        null,
        "estimated",
        "Posting consistency requires historical data spanning multiple weeks",
        "inferred"
      ),
    },
    
    contentPerformance: snapshot.topPosts ? snapshot.topPosts.map((post: any) => ({
      id: post.id || Math.random().toString(),
      caption: post.caption || "",
      likes: wrapMetric(
        post.likes || 0,
        "measured",
        "Like count from public post metrics",
        "scrape"
      ),
      comments: wrapMetric(
        post.comments || 0,
        "measured",
        "Comment count from public post metrics",
        "scrape"
      ),
      shares: wrapMetric(
        post.shares || null,
        post.shares ? "measured" : "unavailable",
        "Share count if publicly available",
        "scrape"
      ),
      views: wrapMetric(
        post.views || null,
        post.views ? "measured" : "unavailable",
        "View count if publicly available",
        "scrape"
      ),
      engagementRate: wrapMetric(
        post.engagementRate || null,
        post.engagementRate ? "estimated" : "unavailable",
        "Engagement calculated as interactions ÷ followers",
        "inferred"
      ),
      postedAt: post.postedAt || null,
    })) : [],
    
    keywords: snapshot.topKeywords ? snapshot.topKeywords.map((kw: any) => ({
      keyword: kw.keyword || kw.word,
      frequency: wrapMetric(
        kw.frequency || kw.count || 0,
        "measured",
        "Number of times keyword appears in public posts and captions",
        "scrape"
      ),
      sentiment: wrapMetric(
        kw.sentiment || null,
        kw.sentiment ? "estimated" : "unavailable",
        "Sentiment of posts containing this keyword",
        "inferred"
      ),
    })) : [],
    
    community: {
      commentVolume: wrapMetric(
        snapshot.commentVolume || null,
        snapshot.commentVolume ? "measured" : "unavailable",
        "Total comments across recent public posts",
        "scrape"
      ),
      
      commentTrend: wrapMetric(
        null,
        "estimated",
        "Comment trend requires multiple data points over time",
        "inferred"
      ),
      
      responseRate: wrapMetric(
        null,
        "unavailable",
        "Response metrics require access to private messages. Not available for external profiles.",
        "scrape"
      ),
      
      responseTrend: wrapMetric(
        null,
        "unavailable",
        "Response metrics require access to private messages. Not available for external profiles.",
        "scrape"
      ),
      
      averageSentiment: wrapMetric(
        null,
        "estimated",
        "Sentiment analysis from public comments only. Limited accuracy for non-business accounts.",
        "inferred"
      ),
      
      consistencyScore: wrapMetric(
        null,
        "estimated",
        "Posting consistency analysis requires extended historical data",
        "inferred"
      ),
      
      alerts: snapshot.error
        ? [`Data fetch error: ${snapshot.error}`]
        : ["External profile - snapshot data. Based on publicly available information only."],
    },
    
    paidContent: [],
    notes: "",
    updatedAt: profile.lastFetchedAt,
    meta: {
      isExternal: true,
      requiresAuth: false,
      dataFreshness: "snapshot",
      lastUpdated: profile.lastFetchedAt,
      cacheExpires: new Date(new Date(profile.lastFetchedAt).getTime() + 12 * 60 * 60 * 1000),
    },
  };
}

/**
 * GET /api/admin/analytics/trending/:talentId
 * 
 * Get trending topics for a specific talent
 * Returns ranked, scored trending topics from multiple sources
 * 
 * Response includes:
 * - topic: The trending topic
 * - source: Where it's trending (GOOGLE, TIKTOK, YOUTUBE, etc)
 * - relevanceScore: 0-1 indicating how relevant to this talent
 * - reasoning: Why this topic is relevant
 * - velocity: How fast it's trending (0-100)
 */
router.get("/trending/:talentId", async (req: Request, res: Response) => {
  try {
    const { talentId } = req.params;

    logInfo("[TRENDS] GET trending topics request", { talentId });

    // Import here to avoid circular dependencies
    const { getTrendingTopicsForTalent } = await import(
      "../../services/trends/trendingTopicsService.js"
    );

    const trendingTopics = await getTrendingTopicsForTalent(talentId);

    if (!trendingTopics || trendingTopics.length === 0) {
      logInfo("[TRENDS] No trending topics found for talent", { talentId });
      return res.json({
        talentId,
        trends: [],
        message: "No trending topics found. Check talent profile data.",
        timestamp: new Date(),
      });
    }

    // Format response with top 10 ranked trends
    const response = {
      talentId,
      trends: trendingTopics.slice(0, 10).map((trend) => ({
        topic: trend.topic,
        source: trend.source,
        relevanceScore: parseFloat((trend.relevanceScore * 100).toFixed(1)),
        velocity: parseFloat(trend.velocity.toFixed(1)),
        category: trend.category,
        reasoning: trend.reasoning,
        relatedKeywords: trend.relatedKeywords,
      })),
      stats: {
        total: trendingTopics.length,
        topScore: trendingTopics[0]?.relevanceScore
          ? parseFloat((trendingTopics[0].relevanceScore * 100).toFixed(1))
          : 0,
        sources: [
          ...new Set(trendingTopics.map((t) => t.source)),
        ].sort(),
      },
      timestamp: new Date(),
    };

    logInfo("[TRENDS] Returning trending topics", {
      talentId,
      count: response.trends.length,
    });

    return res.json(response);
  } catch (error) {
    logError("[TRENDS] Failed to get trending topics", error, { talentId: req.params.talentId });
    return res.status(500).json({
      error: "Failed to fetch trending topics",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;

