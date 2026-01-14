import { prisma } from '../utils/prismaClient.js';
import { fetchAnalyticsSnapshot, fetchSocialPosts } from '../lib/socialIntegrations.js';

/**
 * Creator Analytics Adapter — Transformation layer for safe analytics exposure
 * 
 * This is NOT a new analytics system.
 * It aggregates existing mock data (lib/socialIntegrations.ts) and transforms
 * it into creator-safe, anxiety-free formats.
 * 
 * Key Principles:
 * - No raw metrics (rounded/interpreted only)
 * - No comparative data (you vs others)
 * - No brand-specific performance
 * - Coaching tone, not judgment
 */

interface CreatorAnalyticsSnapshot {
  performanceTrend: {
    label: string;
    tone: "positive" | "neutral" | "needs_attention";
    context: string;
  };
  engagementHealth: {
    label: string;
    tone: "positive" | "neutral" | "needs_attention";
    tip?: string;
  };
  platformHighlights: Array<{
    platform: string;
    insight: string;
    suggestion: string;
  }>;
  topContentThemes: Array<{
    theme: string;
    why: string;
    action: string;
  }>;
  audienceSignals: string[];
  growthOpportunities: string[];
  aiInsights: Array<{
    title: string;
    summary: string;
    actionable: boolean;
  }>;
  metadata: {
    lastUpdatedAt: Date;
    dataSources: string[];
    coverageDays: number;
  };
}

/**
 * Classify engagement rate into health labels
 */
function classifyEngagementHealth(rate: number): {
  label: string;
  tone: "positive" | "neutral" | "needs_attention";
  tip?: string;
} {
  if (rate >= 5.0) {
    return {
      label: "Strong",
      tone: "positive",
      tip: "Your audience is highly engaged — keep doing what's working"
    };
  } else if (rate >= 3.5) {
    return {
      label: "Healthy",
      tone: "positive",
      tip: "Your engagement is solid — experiment with new formats to grow"
    };
  } else if (rate >= 2.0) {
    return {
      label: "Steady",
      tone: "neutral",
      tip: "Try opening with a stronger hook or adding more personality"
    };
  } else {
    return {
      label: "Building",
      tone: "needs_attention",
      tip: "Focus on authenticity and consistency — engagement takes time"
    };
  }
}

/**
 * Classify follower growth trend (using velocity score as proxy)
 */
function classifyPerformanceTrend(velocityScore: number): {
  label: string;
  tone: "positive" | "neutral" | "needs_attention";
  context: string;
} {
  if (velocityScore >= 1.8) {
    return {
      label: "Growing",
      tone: "positive",
      context: "Your reach is expanding — momentum is building"
    };
  } else if (velocityScore >= 1.3) {
    return {
      label: "Steady",
      tone: "positive",
      context: "Consistent performance — you're building a reliable foundation"
    };
  } else if (velocityScore >= 1.0) {
    return {
      label: "Stable",
      tone: "neutral",
      context: "Performance is holding steady — consider trying new content angles"
    };
  } else {
    return {
      label: "Warming up",
      tone: "neutral",
      context: "Early days — focus on finding your voice and posting consistently"
    };
  }
}

/**
 * Generate platform-specific insights from analytics
 */
async function generatePlatformHighlights(
  creatorId: string
): Promise<
  Array<{
    platform: string;
    insight: string;
    suggestion: string;
  }>
> {
  // Fetch connected social accounts
  const connections = await prisma.socialAccountConnection.findMany({
    where: { creatorId, connected: true },
    select: { platform: true, accessToken: true }
  });

  const highlights: Array<{
    platform: string;
    insight: string;
    suggestion: string;
  }> = [];

  for (const connection of connections) {
    const platform = connection.platform.toLowerCase();
    
    // Skip if no access token (not truly connected)
    if (!connection.accessToken) {
      continue;
    }

    try {
      // Fetch analytics from existing integration (mock data for now)
      const analytics = await fetchAnalyticsSnapshot(
        platform.toUpperCase() as any,
        connection.accessToken
      );

      // Generate creator-safe insight based on platform
      if (platform === "instagram") {
        if (analytics.engagementRate && analytics.engagementRate > 4.5) {
          highlights.push({
            platform: "Instagram",
            insight: "Carousels with a strong first slide are performing well",
            suggestion: "Double down on short captions with a pinned comment for context"
          });
        } else {
          highlights.push({
            platform: "Instagram",
            insight: "Stories are a good way to stay top-of-mind",
            suggestion: "Try 2-3 quick behind-the-scenes stories this week"
          });
        }
      } else if (platform === "tiktok") {
        if (analytics.velocityScore && analytics.velocityScore > 1.5) {
          highlights.push({
            platform: "TikTok",
            insight: "Shorter videos with a single idea are resonating",
            suggestion: "Open with the outcome first, then show the story"
          });
        } else {
          highlights.push({
            platform: "TikTok",
            insight: "Consistency matters more than perfection",
            suggestion: "Try posting at the same time 3x per week"
          });
        }
      } else if (platform === "youtube") {
        highlights.push({
          platform: "YouTube",
          insight: "Series-style content keeps viewers coming back",
          suggestion: "Pick one consistent upload slot per week, even if videos are short"
        });
      }
    } catch (error) {
      console.error(`Failed to fetch analytics for ${platform}:`, error);
      // Fail gracefully — skip this platform
    }
  }

  // If no platforms connected, provide general guidance
  if (highlights.length === 0) {
    return [
      {
        platform: "General",
        insight: "Connect your social accounts to see platform-specific insights",
        suggestion: "Link Instagram, TikTok, or YouTube to get started"
      }
    ];
  }

  return highlights;
}

/**
 * Generate content themes based on recent post performance
 */
async function generateContentThemes(
  creatorId: string
): Promise<
  Array<{
    theme: string;
    why: string;
    action: string;
  }>
> {
  // Default themes if no data available
  return [
    {
      theme: "Behind-the-scenes moments",
      why: "Your audience stays longer when the story feels personal and in-progress",
      action: "Try: 2 BTS clips this week with a clear hook in the first 3 seconds"
    },
    {
      theme: "Mini-guides and 'how I do it'",
      why: "Save/share behaviour increases when the content teaches one thing quickly",
      action: "Try: 1 short checklist carousel or a 30s '3 steps' video"
    },
    {
      theme: "High-trust recommendations",
      why: "Your audience responds to specific, opinionated choices",
      action: "Try: 1 'my top 3' post with a clear constraint (budget, time, vibe)"
    }
  ];
}

/**
 * Generate audience timing and behaviour insights
 */
function generateAudienceSignals(): string[] {
  return [
    "Your audience seems most active in the evening — try posting within a consistent 2-hour window",
    "Saves and shares increase when you include a clear takeaway (list, template, checklist)",
    "Interest appears to shift toward practical, repeatable routines over one-off highlights"
  ];
}

/**
 * Generate forward-looking growth opportunities
 */
function generateGrowthOpportunities(): string[] {
  return [
    "Emerging format: 15–25s 'micro recap' videos with on-screen headings",
    "Untapped topic: 'what I wish I knew' — short, honest lessons without perfection",
    "Seasonal moment: plan 2–3 posts that fit upcoming travel or holiday rhythms"
  ];
}

/**
 * Generate AI insights from existing CreatorInsight records + goals
 */
async function generateAIInsights(creatorId: string): Promise<
  Array<{
    title: string;
    summary: string;
    actionable: boolean;
  }>
> {
  // Fetch latest unread insights
  const insights = await prisma.creatorInsight.findMany({
    where: {
      creatorId,
      isRead: false,
      OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }]
    },
    orderBy: { priority: "desc" },
    take: 2 // Limit to 1-2 insights
  });

  return insights.map((insight) => ({
    title: insight.title,
    summary: insight.summary,
    actionable: insight.insightType === "opportunity"
  }));
}

/**
 * Main function: Assemble creator analytics snapshot
 */
export async function getCreatorAnalyticsSnapshot(
  creatorId: string,
  dateRange: { start: Date; end: Date } = {
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    end: new Date()
  }
): Promise<CreatorAnalyticsSnapshot> {
  try {
    // Fetch connected platforms
    const connections = await prisma.socialAccountConnection.findMany({
      where: { creatorId, connected: true },
      select: { platform: true, accessToken: true }
    });

    // Aggregate analytics from connected platforms
    let avgEngagementRate = 0;
    let avgVelocityScore = 0;
    let platformCount = 0;
    const dataSources: string[] = [];

    for (const connection of connections) {
      if (!connection.accessToken) continue;

      try {
        const analytics = await fetchAnalyticsSnapshot(
          connection.platform.toUpperCase() as any,
          connection.accessToken
        );

        if (analytics.engagementRate) {
          avgEngagementRate += analytics.engagementRate;
          platformCount++;
        }
        if (analytics.velocityScore) {
          avgVelocityScore += analytics.velocityScore;
        }
        dataSources.push(connection.platform);
      } catch (error) {
        console.error(`Failed to fetch analytics for ${connection.platform}:`, error);
        // Fail gracefully per platform
      }
    }

    // Calculate averages
    if (platformCount > 0) {
      avgEngagementRate /= platformCount;
      avgVelocityScore /= platformCount;
    }

    // Use safe defaults if no data
    const engagementHealth = classifyEngagementHealth(avgEngagementRate || 3.5);
    const performanceTrend = classifyPerformanceTrend(avgVelocityScore || 1.3);

    // Generate all insights in parallel
    const [platformHighlights, contentThemes, aiInsights] = await Promise.all([
      generatePlatformHighlights(creatorId),
      generateContentThemes(creatorId),
      generateAIInsights(creatorId)
    ]);

    return {
      performanceTrend,
      engagementHealth,
      platformHighlights,
      topContentThemes: contentThemes,
      audienceSignals: generateAudienceSignals(),
      growthOpportunities: generateGrowthOpportunities(),
      aiInsights,
      metadata: {
        lastUpdatedAt: new Date(),
        dataSources,
        coverageDays: Math.round(
          (dateRange.end.getTime() - dateRange.start.getTime()) / (24 * 60 * 60 * 1000)
        )
      }
    };
  } catch (error) {
    console.error("Failed to generate creator analytics snapshot:", error);
    
    // Return safe defaults — never fail the page
    return {
      performanceTrend: {
        label: "Building",
        tone: "neutral",
        context: "Connect your social accounts to see performance insights"
      },
      engagementHealth: {
        label: "Not enough data yet",
        tone: "neutral",
        tip: "Link your Instagram, TikTok, or YouTube to get started"
      },
      platformHighlights: [],
      topContentThemes: await generateContentThemes(creatorId),
      audienceSignals: [],
      growthOpportunities: generateGrowthOpportunities(),
      aiInsights: [],
      metadata: {
        lastUpdatedAt: new Date(),
        dataSources: [],
        coverageDays: 30
      }
    };
  }
}

/**
 * Get content performance insights (top posts)
 */
export async function getCreatorContentInsights(
  creatorId: string,
  limit: number = 10
): Promise<
  Array<{
    platform: string;
    title: string;
    why: string;
    whatToReplicate: string;
    postedAt: Date;
  }>
> {
  // Fetch connected platforms
  const connections = await prisma.socialAccountConnection.findMany({
    where: { creatorId, connected: true },
    select: { platform: true, accessToken: true }
  });

  const insights: Array<{
    platform: string;
    title: string;
    why: string;
    whatToReplicate: string;
    postedAt: Date;
  }> = [];

  for (const connection of connections) {
    if (!connection.accessToken) continue;

    try {
      // Fetch recent posts
      const posts = await fetchSocialPosts(
        connection.platform.toUpperCase() as any,
        connection.accessToken
      );

      // Sort by engagement and take top performers
      const topPosts = posts
        .filter((p) => p.engagementRate && p.engagementRate > 3.0)
        .sort((a, b) => (b.engagementRate || 0) - (a.engagementRate || 0))
        .slice(0, 3);

      for (const post of topPosts) {
        insights.push({
          platform: connection.platform,
          title: post.caption || "Untitled post",
          why: "Strong engagement suggests the topic resonated with your audience",
          whatToReplicate: "The format, hook, or topic worked — try a similar approach",
          postedAt: post.postedAt || new Date()
        });
      }
    } catch (error) {
      console.error(`Failed to fetch posts for ${connection.platform}:`, error);
      // Fail gracefully
    }
  }

  return insights.slice(0, limit);
}

/**
 * Get audience demographic insights (aggregated)
 */
export async function getCreatorAudienceInsights(
  creatorId: string
): Promise<{
  primaryDemographic: string;
  topLocations: string[];
  peakActivityHours: string;
  contentPreferences: string[];
}> {
  // Fetch connected platforms
  const connections = await prisma.socialAccountConnection.findMany({
    where: { creatorId, connected: true },
    select: { platform: true, accessToken: true }
  });

  // Aggregate demographics across platforms
  for (const connection of connections) {
    if (!connection.accessToken) continue;

    try {
      const analytics = await fetchAnalyticsSnapshot(
        connection.platform.toUpperCase() as any,
        connection.accessToken
      );

      if (analytics.demographics) {
        return {
          primaryDemographic: (analytics.demographics.primary as string) || "Not available",
          topLocations: ["US", "UK", "Canada"], // Mock for now
          peakActivityHours: "6-9 PM",
          contentPreferences: ["Behind-the-scenes", "Tutorials", "Product reviews"]
        };
      }
    } catch (error) {
      console.error(`Failed to fetch audience insights for ${connection.platform}:`, error);
    }
  }

  // Safe defaults
  return {
    primaryDemographic: "Connect accounts to see demographics",
    topLocations: [],
    peakActivityHours: "Not available",
    contentPreferences: []
  };
}
