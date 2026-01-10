import { Router, Request, Response } from "express";
import prisma from "../../lib/prisma.js";
import { getTalentSocialIntelligence } from "../../services/socialIntelligenceService.js";
import { logError } from "../../lib/logger.js";

const router = Router();

/**
 * GET /api/admin/analytics
 * 
 * Global analytics endpoint supporting multiple input types:
 * - talentId: Analyze an internal talent profile
 * - profileId: Analyze a connected social profile
 * - platform + handle: Analyze any external social URL
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const { talentId, profileId, platform, handle, dateRange } = req.query;

    // Case 1: Analyze talent by ID
    if (talentId && typeof talentId === "string") {
      try {
        const talentData = await getTalentSocialIntelligence(talentId);
        return res.json(talentData);
      } catch (err) {
        console.error("[ANALYTICS] Error fetching talent analytics:", err);
        return res.status(500).json({ error: "Failed to fetch talent analytics" });
      }
    }

    // Case 2: Analyze connected profile by ID
    if (profileId && typeof profileId === "string") {
      try {
        const profile = await prisma.socialProfile.findUnique({
          where: { id: profileId },
          include: {
            posts: { orderBy: { postedAt: "desc" }, take: 100 },
          },
        });

        if (!profile) {
          return res.status(404).json({ error: "Profile not found" });
        }

        // Build analytics from profile data
        const analytics = await buildAnalyticsFromProfile(profile, dateRange as string | undefined);
        return res.json(analytics);
      } catch (err) {
        console.error("[ANALYTICS] Error fetching profile analytics:", err);
        return res.status(500).json({ error: "Failed to fetch profile analytics" });
      }
    }

    // Case 3: Analyze external profile by platform + handle
    if (platform && handle && typeof platform === "string" && typeof handle === "string") {
      try {
        // Check if profile already exists
        let profile = await prisma.socialProfile.findFirst({
          where: {
            platform: platform.toUpperCase(),
            handle: handle.toLowerCase(),
          },
          include: {
            posts: { orderBy: { postedAt: "desc" }, take: 100 },
          },
        });

        if (!profile) {
          // Return empty analytics for external profile (can be extended to fetch from APIs)
          const emptyAnalytics = buildEmptyAnalytics(handle, platform.toUpperCase());
          return res.json(emptyAnalytics);
        }

        // Build analytics from profile data
        const analytics = await buildAnalyticsFromProfile(profile, dateRange as string | undefined);
        return res.json(analytics);
      } catch (err) {
        console.error("[ANALYTICS] Error analyzing external profile:", err);
        return res.status(500).json({ error: "Failed to analyze external profile" });
      }
    }

    return res.status(400).json({ error: "Missing required parameters" });
  } catch (error) {
    logError("Failed to fetch analytics", error, {
      userId: (req as any).user?.id,
    });
    return res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

/**
 * GET /api/admin/analytics/connected-profiles
 * 
 * Fetch all connected social profiles for quick selection
 */
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

export default router;
