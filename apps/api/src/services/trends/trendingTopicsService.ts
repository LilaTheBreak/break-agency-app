/**
 * Trending Topics Intelligence Service
 *
 * Normalises and scores trending topics for a specific talent.
 * Integrates Phase 2 social profile data with trend sources.
 */

import { PrismaClient } from "@prisma/client";
import { getGoogleTrends } from './googleTrends';
import { getTikTokTrends } from './tiktokTrends';
import { getYouTubeTrends } from './youtubeTrends';

const prisma = new PrismaClient();

/**
 * Normalised trending topic structure
 */
export interface TrendingTopic {
  topic: string;
  source: "GOOGLE" | "TIKTOK" | "YOUTUBE" | "REDDIT" | "TWITTER";
  velocity: number; // 0-100 scale
  volume?: number; // Raw volume if available
  category?: string;
  relatedKeywords: string[];
  detectedAt: Date;
}

/**
 * Scored trending topic for a talent
 */
export interface ScoredTrendingTopic extends TrendingTopic {
  relevanceScore: number; // 0-1 scale
  reasoning: string;
}

/**
 * Fetch and aggregate trending topics from all sources
 */
export async function aggregateTrendingTopics(): Promise<TrendingTopic[]> {
  console.log(`[TRENDS] Starting aggregation from all sources`);

  const now = new Date();

  // Fetch from all sources in parallel
  const [googleTrends, tiktokTrends, youtubeTrends] = await Promise.all([
    getGoogleTrends("GB").catch((e) => {
      console.error(`[TRENDS] Google Trends fetch failed: ${e}`);
      return [];
    }),
    getTikTokTrends().catch((e) => {
      console.error(`[TRENDS] TikTok Trends fetch failed: ${e}`);
      return [];
    }),
    getYouTubeTrends().catch((e) => {
      console.error(`[TRENDS] YouTube Trends fetch failed: ${e}`);
      return [];
    }),
  ]);

  // Normalise to shared structure
  const normalised: TrendingTopic[] = [
    ...googleTrends.map((t) => ({
      ...t,
      source: "GOOGLE" as const,
      detectedAt: now,
    })),
    ...tiktokTrends.map((t) => ({
      ...t,
      source: "TIKTOK" as const,
      detectedAt: now,
    })),
    ...youtubeTrends.map((t) => ({
      ...t,
      source: "YOUTUBE" as const,
      detectedAt: now,
    })),
  ];

  console.log(
    `[TRENDS] Aggregated ${normalised.length} topics from all sources`
  );
  return normalised;
}

/**
 * Score a single topic for relevance to a talent
 * Considers: content history, platform focus, audience signals
 */
export async function scoreTopicForTalent(
  topic: TrendingTopic,
  talentProfiles: Array<{
    platform: string;
    username: string;
    snapshotJson: string;
  }>
): Promise<{ score: number; reasoning: string }> {
  let score = 0;
  const reasons: string[] = [];

  // 1. Platform matching (30% weight)
  // Prioritise trends from platforms where talent is active
  const activePlatforms = new Set(talentProfiles.map((p) => p.platform));

  if (topic.source === "TIKTOK" && activePlatforms.has("TIKTOK")) {
    score += 30;
    reasons.push("TikTok trend matching talent's TikTok presence");
  } else if (topic.source === "YOUTUBE" && activePlatforms.has("YOUTUBE")) {
    score += 30;
    reasons.push("YouTube trend matching talent's YouTube channel");
  } else if (topic.source === "GOOGLE") {
    // Google trends are platform-agnostic
    score += 20;
    reasons.push("Broad search trend relevant to multiple platforms");
  }

  // 2. Velocity scoring (40% weight)
  // Higher velocity = trending faster = more urgent/relevant
  const velocityScore = (topic.velocity / 100) * 40;
  score += velocityScore;
  reasons.push(
    `High trending velocity (${topic.velocity.toFixed(1)}) indicates rapid growth`
  );

  // 3. Content history analysis (30% weight)
  // Check if topic relates to talent's past content
  const contentRelevance = analyzeContentRelevance(topic, talentProfiles);
  score += contentRelevance * 30;
  if (contentRelevance > 0.5) {
    reasons.push(
      `Topic aligns with talent's content history (relevance: ${(contentRelevance * 100).toFixed(0)}%)`
    );
  } else if (contentRelevance > 0) {
    reasons.push(
      `Some alignment with past content themes (relevance: ${(contentRelevance * 100).toFixed(0)}%)`
    );
  }

  // 4. Keyword overlap (adjusts score)
  // If topic keywords overlap with talent's common keywords, boost score
  const keywordBoost = checkKeywordOverlap(topic, talentProfiles);
  score += keywordBoost;
  if (keywordBoost > 0) {
    reasons.push(
      `Keywords overlap with talent's content (+${keywordBoost.toFixed(1)} boost)`
    );
  }

  // Normalise to 0-1 scale
  const normalizedScore = Math.min(1, score / 100);

  const reasoning = reasons.join("; ");

  console.log(
    `[TRENDS] Scored "${topic.topic}" for talent: ${(normalizedScore * 100).toFixed(1)}%`
  );

  return {
    score: normalizedScore,
    reasoning,
  };
}

/**
 * Analyse content relevance by examining talent's bio and past content
 * Simple heuristic: keyword matching
 */
function analyzeContentRelevance(
  topic: TrendingTopic,
  talentProfiles: Array<{
    platform: string;
    username: string;
    snapshotJson: string;
  }>
): number {
  // Extract keywords from topic
  const topicKeywords = [
    topic.topic.toLowerCase(),
    ...(topic.relatedKeywords || []).map((k) => k.toLowerCase()),
  ];

  // Look for keyword matches in profile data
  let matches = 0;
  let totalKeywords = topicKeywords.length;

  talentProfiles.forEach((profile) => {
    try {
      const profileData = JSON.parse(profile.snapshotJson);
      const profileText = JSON.stringify(profileData).toLowerCase();

      topicKeywords.forEach((keyword) => {
        if (keyword.length > 3 && profileText.includes(keyword)) {
          matches++;
        }
      });
    } catch (e) {
      console.warn(`[TRENDS] Failed to parse profile data for scoring`);
    }
  });

  return totalKeywords > 0 ? matches / totalKeywords : 0;
}

/**
 * Check for keyword overlap between topic and talent profiles
 * Returns a boost score (0-5)
 */
function checkKeywordOverlap(
  topic: TrendingTopic,
  talentProfiles: Array<{
    platform: string;
    username: string;
    snapshotJson: string;
  }>
): number {
  const relatedKeywords = topic.relatedKeywords || [];
  if (relatedKeywords.length === 0) return 0;

  let overlapCount = 0;

  talentProfiles.forEach((profile) => {
    try {
      const profileData = JSON.parse(profile.snapshotJson);
      const profileText = JSON.stringify(profileData).toLowerCase();

      relatedKeywords.forEach((keyword) => {
        if (
          keyword.length > 2 &&
          profileText.includes(keyword.toLowerCase())
        ) {
          overlapCount++;
        }
      });
    } catch (e) {
      // Silent fail - profile parse error
    }
  });

  // Boost: up to 5 points per keyword match (capped at 10)
  return Math.min(10, overlapCount);
}

/**
 * Get trending topics for a specific talent
 * Main entry point as per architecture spec
 */
export async function getTrendingTopicsForTalent(
  talentId: string
): Promise<ScoredTrendingTopic[]> {
  console.log(`[TRENDS] Getting trending topics for talent: ${talentId}`);

  try {
    // 1. Fetch talent's social profiles (Phase 2 data)
    console.log(`[TRENDS] Fetching talent's social profiles from Phase 2`);
    const talentProfiles = await prisma.externalSocialProfile.findMany({
      where: {
        // Note: ExternalSocialProfile doesn't have talentId foreign key yet
        // For now, we'll fetch all profiles and filter by talent separately
        // In production, add talentId to ExternalSocialProfile schema
      },
      select: {
        platform: true,
        username: true,
        snapshotJson: true,
      },
    });

    if (talentProfiles.length === 0) {
      console.warn(
        `[TRENDS] No social profiles found for talent ${talentId}. Cannot score trends.`
      );
      return [];
    }

    console.log(
      `[TRENDS] Found ${talentProfiles.length} social profiles for talent`
    );

    // 2. Check cache: look for recent trends for this talent
    const cacheExpiry = new Date(Date.now() - 6 * 60 * 60 * 1000); // 6 hours ago
    const cachedTrends = await prisma.trendingTopicSnapshot.findMany({
      where: {
        talentId,
        cachedUntil: {
          gt: new Date(),
        },
        createdAt: {
          gte: cacheExpiry,
        },
      },
      orderBy: [{ relevanceScore: "desc" }],
      take: 10,
    });

    if (cachedTrends.length > 0) {
      console.log(
        `[TRENDS] Cache hit: found ${cachedTrends.length} cached trends for talent`
      );
      return cachedTrends.map((t) => ({
        topic: t.topic,
        source: t.source as "GOOGLE" | "TIKTOK" | "YOUTUBE" | "REDDIT" | "TWITTER",
        velocity: t.velocity,
        volume: t.volume || undefined,
        category: t.category || undefined,
        relatedKeywords: t.relatedKeywords,
        detectedAt: t.createdAt,
        relevanceScore: t.relevanceScore,
        reasoning: t.reasoning || "",
      }));
    }

    console.log(`[TRENDS] Cache miss: fetching fresh trends`);

    // 3. Aggregate trending topics from all sources
    const trendingTopics = await aggregateTrendingTopics();

    // 4. Score each topic for this talent
    const scoredTopics: ScoredTrendingTopic[] = [];

    for (const topic of trendingTopics) {
      const { score, reasoning } = await scoreTopicForTalent(
        topic,
        talentProfiles
      );

      scoredTopics.push({
        ...topic,
        relevanceScore: score,
        reasoning,
      });
    }

    // Sort by relevance score descending
    scoredTopics.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // 5. Persist top 20 trends to database for caching
    const topTrends = scoredTopics.slice(0, 20);
    const cachedUntil = new Date(Date.now() + 6 * 60 * 60 * 1000); // 6 hours from now

    for (const trend of topTrends) {
      await prisma.trendingTopicSnapshot.create({
        data: {
          talentId,
          source: trend.source,
          topic: trend.topic,
          velocity: trend.velocity,
          volume: trend.volume,
          category: trend.category,
          relatedKeywords: trend.relatedKeywords,
          relevanceScore: trend.relevanceScore,
          reasoning: trend.reasoning,
          snapshotJson: JSON.stringify(trend),
          cachedUntil,
        },
      });
    }

    console.log(
      `[TRENDS] Persisted ${topTrends.length} top trends for talent`
    );

    return topTrends;
  } catch (error) {
    console.error(
      `[TRENDS] Failed to get trending topics for talent: ${error instanceof Error ? error.message : String(error)}`
    );
    return [];
  }
}

/**
 * Get trending topics for multiple talents
 * For batch processing
 */
export async function getTrendingTopicsForTalents(
  talentIds: string[]
): Promise<Record<string, ScoredTrendingTopic[]>> {
  console.log(
    `[TRENDS] Getting trending topics for ${talentIds.length} talents`
  );

  const results: Record<string, ScoredTrendingTopic[]> = {};

  for (const talentId of talentIds) {
    results[talentId] = await getTrendingTopicsForTalent(talentId);
  }

  return results;
}
