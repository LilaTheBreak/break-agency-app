/**
 * YouTube Platform Service
 *
 * Handles YouTube Data API v3 integration for channel analytics:
 * - Channel statistics (subscribers, views, video count)
 * - Top videos (trending, recent)
 * - Quota management
 * - Caching strategy
 *
 * Environment:
 * - GOOGLE_YOUTUBE_API_KEY: Required for API access
 */

import { logInfo, logError, logWarn } from '../../lib/logger';
import prisma from '../../lib/prisma';

export interface YouTubeChannelMetrics {
  channelId: string;
  title: string;
  description: string;
  profileImageUrl: string;
  subscriberCount: number;
  viewCount: number;
  videoCount: number;
  joinedAt: string;
  verificationStatus: string;
  topics: string[];
  topVideos?: YouTubeVideoMetric[];
  quotaUsed?: number;
}

export interface YouTubeVideoMetric {
  videoId: string;
  title: string;
  publishedAt: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  duration: string;
  thumbnail: string;
}

/**
 * Fetch YouTube channel metrics via official API v3
 *
 * Supports multiple channel identifier formats:
 * - @handle (e.g., @cristiano)
 * - Channel ID (e.g., UC_...)
 * - Custom URL
 */
export async function fetchYouTubeMetrics(
  identifier: string,
  options?: {
    includeVideos?: boolean;
    maxVideoResults?: number;
    cache?: { maxAge: number }; // hours
  }
): Promise<{
  metrics: YouTubeChannelMetrics | null;
  cached: boolean;
  quotaUsed: number;
  error?: string;
}> {
  const apiKey = process.env.GOOGLE_YOUTUBE_API_KEY;

  if (!apiKey) {
    logWarn("[YOUTUBE] API key not configured", {
      identifier,
      feature: "YouTube metrics",
    });
    return {
      metrics: null,
      cached: false,
      quotaUsed: 0,
      error: "YouTube API key not configured",
    };
  }

  logInfo("[YOUTUBE] Fetching metrics", {
    identifier,
    includeVideos: options?.includeVideos ?? false,
  });

  try {
    // Check cache first if enabled
    if (options?.cache?.maxAge) {
      const cached = await getYouTubeCachedMetrics(identifier, options.cache.maxAge);
      if (cached) {
        logInfo("[YOUTUBE] Cache hit", { identifier });
        return {
          metrics: cached,
          cached: true,
          quotaUsed: 0,
        };
      }
    }

    // Step 1: Resolve identifier to channel ID
    let channelId: string | null = null;

    if (identifier.match(/^UC[a-zA-Z0-9_-]{22}$/)) {
      // Already a channel ID
      channelId = identifier;
    } else if (identifier.startsWith("@")) {
      // @handle format
      channelId = await resolveHandleToChannelId(identifier.substring(1), apiKey);
    } else {
      // Try to resolve as custom URL or username
      channelId = await resolveHandleToChannelId(identifier, apiKey);
    }

    if (!channelId) {
      return {
        metrics: null,
        cached: false,
        quotaUsed: 1, // Search consumed quota
        error: `Could not resolve YouTube identifier: ${identifier}`,
      };
    }

    // Step 2: Fetch channel details
    const channelMetrics = await getChannelDetails(channelId, apiKey);

    if (!channelMetrics) {
      return {
        metrics: null,
        cached: false,
        quotaUsed: 1,
        error: `Channel not found: ${identifier}`,
      };
    }

    // Step 3: Fetch top videos if requested
    if (options?.includeVideos) {
      const topVideos = await getTopVideos(
        channelId,
        apiKey,
        options.maxVideoResults ?? 10
      );
      channelMetrics.topVideos = topVideos;
    }

    // Step 4: Cache result
    await cacheYouTubeMetrics(identifier, channelMetrics);

    logInfo("[YOUTUBE] Metrics fetched successfully", {
      identifier,
      subscriberCount: channelMetrics.subscriberCount,
      videoCount: channelMetrics.videoCount,
    });

    return {
      metrics: channelMetrics,
      cached: false,
      quotaUsed: options?.includeVideos ? 3 : 1, // Estimate: 1 for channel, 2 for videos
    };
  } catch (error) {
    logError("[YOUTUBE] Failed to fetch metrics", error, { identifier });
    return {
      metrics: null,
      cached: false,
      quotaUsed: 1,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch YouTube metrics",
    };
  }
}

/**
 * Resolve @handle or username to YouTube channel ID
 */
async function resolveHandleToChannelId(
  identifier: string,
  apiKey: string
): Promise<string | null> {
  try {
    const url = new URL("https://www.googleapis.com/youtube/v3/search");
    url.searchParams.set("part", "snippet");
    url.searchParams.set("type", "channel");
    url.searchParams.set("q", identifier);
    url.searchParams.set("maxResults", "1");
    url.searchParams.set("key", apiKey);

    logInfo("[YOUTUBE] Searching for channel", { identifier });

    const response = await fetch(url.toString());

    if (!response.ok) {
      logWarn("[YOUTUBE] Search failed", {
        identifier,
        status: response.status,
      });
      return null;
    }

    const data: any = await response.json();

    if (!data.items || data.items.length === 0) {
      logWarn("[YOUTUBE] No channel found", { identifier });
      return null;
    }

    const channelId = data.items[0].id.channelId;
    logInfo("[YOUTUBE] Channel found", { identifier, channelId });
    return channelId;
  } catch (error) {
    logError("[YOUTUBE] Error resolving handle", error, { identifier });
    return null;
  }
}

/**
 * Fetch channel statistics via YouTube API v3
 */
async function getChannelDetails(
  channelId: string,
  apiKey: string
): Promise<YouTubeChannelMetrics | null> {
  try {
    const url = new URL("https://www.googleapis.com/youtube/v3/channels");
    url.searchParams.set("part", "statistics,snippet,topicDetails");
    url.searchParams.set("id", channelId);
    url.searchParams.set("key", apiKey);

    const response = await fetch(url.toString());

    if (!response.ok) {
      logWarn("[YOUTUBE] Channel fetch failed", {
        channelId,
        status: response.status,
      });
      return null;
    }

    const data: any = await response.json();

    // 🚨 CRITICAL PROTECTION: If we got 200 but no items, YouTube changed response structure
    if (!data.items || data.items.length === 0) {
      if (response.status === 200) {
        logError(
          "[YOUTUBE] CRITICAL: JSON_FETCH_OK_BUT_PARSE_FAILED",
          new Error("API fetch succeeded (200) but no items in response. YouTube may have changed their API structure."),
          { channelId, dataKeys: data ? Object.keys(data) : "null" }
        );
        throw new Error("JSON_FETCH_OK_BUT_PARSE_FAILED");
      }
      return null;
    }

    const channel = data.items[0];
    const stats = channel.statistics || {};
    const snippet = channel.snippet || {};
    const topics = channel.topicDetails?.topicIds || [];

    return {
      channelId,
      title: snippet.title || "",
      description: snippet.description || "",
      profileImageUrl: snippet.thumbnails?.default?.url || "",
      subscriberCount: parseInt(stats.subscriberCount || "0", 10),
      viewCount: parseInt(stats.viewCount || "0", 10),
      videoCount: parseInt(stats.videoCount || "0", 10),
      joinedAt: snippet.publishedAt || new Date().toISOString(),
      verificationStatus: snippet.status?.isLinked ? "verified" : "unverified",
      topics: topics.map((t: string) => t.replace("https://en.wikipedia.org/wiki/", "")),
    };
  } catch (error) {
    logError("[YOUTUBE] Error fetching channel details", error, { channelId });
    return null;
  }
}

/**
 * Fetch top videos from channel
 */
async function getTopVideos(
  channelId: string,
  apiKey: string,
  maxResults: number = 10
): Promise<YouTubeVideoMetric[]> {
  try {
    const url = new URL("https://www.googleapis.com/youtube/v3/search");
    url.searchParams.set("part", "snippet");
    url.searchParams.set("channelId", channelId);
    url.searchParams.set("type", "video");
    url.searchParams.set("order", "viewCount");
    url.searchParams.set("maxResults", String(maxResults));
    url.searchParams.set("key", apiKey);

    const response = await fetch(url.toString());

    if (!response.ok) {
      logWarn("[YOUTUBE] Top videos search failed", {
        channelId,
        status: response.status,
      });
      return [];
    }

    const searchData: any = await response.json();

    if (!searchData.items || searchData.items.length === 0) {
      return [];
    }

    const videoIds = searchData.items.map((item: any) => item.id.videoId);

    // Get video details (statistics)
    const detailsUrl = new URL(
      "https://www.googleapis.com/youtube/v3/videos"
    );
    detailsUrl.searchParams.set("part", "statistics,snippet,contentDetails");
    detailsUrl.searchParams.set("id", videoIds.join(","));
    detailsUrl.searchParams.set("key", apiKey);

    const detailsResponse = await fetch(detailsUrl.toString());

    if (!detailsResponse.ok) {
      return [];
    }

    const detailsData: any = await detailsResponse.json();

    if (!detailsData.items || detailsData.items.length === 0) {
      logWarn("[YOUTUBE] Details response returned 200 but no items found", {
        channelId,
        dataKeys: Object.keys(detailsData),
      });
      throw new Error("JSON_FETCH_OK_BUT_PARSE_FAILED");
    }

    return detailsData.items.map((video: any) => ({
      videoId: video.id,
      title: video.snippet?.title || "",
      publishedAt: video.snippet?.publishedAt || "",
      viewCount: parseInt(video.statistics?.viewCount || "0", 10),
      likeCount: parseInt(video.statistics?.likeCount || "0", 10),
      commentCount: parseInt(video.statistics?.commentCount || "0", 10),
      duration: video.contentDetails?.duration || "",
      thumbnail: video.snippet?.thumbnails?.default?.url || "",
    }));
  } catch (error) {
    logError("[YOUTUBE] Error fetching top videos", error, { channelId });
    return [];
  }
}

/**
 * Cache YouTube metrics in ExternalSocialProfile
 */
async function cacheYouTubeMetrics(
  identifier: string,
  metrics: YouTubeChannelMetrics
): Promise<void> {
  try {
    await prisma.externalSocialProfile.upsert({
      where: {
        platform_username: {
          platform: "YOUTUBE",
          username: identifier.replace("@", ""),
        },
      },
      update: {
        profileUrl: `https://youtube.com/@${metrics.channelId}`,
        snapshotJson: JSON.stringify({
          metrics,
          fetchedAt: new Date().toISOString(),
        }),
        lastFetchedAt: new Date(),
        updatedAt: new Date(),
      },
      create: {
        platform: "YOUTUBE",
        username: identifier.replace("@", ""),
        profileUrl: `https://youtube.com/@${metrics.channelId}`,
        snapshotJson: JSON.stringify({
          metrics,
          fetchedAt: new Date().toISOString(),
        }),
      },
    });

    logInfo("[YOUTUBE] Metrics cached", {
      identifier,
      platform: "YOUTUBE",
    });
  } catch (error) {
    logError("[YOUTUBE] Error caching metrics", error, { identifier });
    // Don't throw - caching failure shouldn't break the flow
  }
}

/**
 * Retrieve cached YouTube metrics
 */
async function getYouTubeCachedMetrics(
  identifier: string,
  maxAge: number // hours
): Promise<YouTubeChannelMetrics | null> {
  try {
    const cutoff = new Date(Date.now() - maxAge * 3600 * 1000);

    const cached = await prisma.externalSocialProfile.findUnique({
      where: {
        platform_username: {
          platform: "YOUTUBE",
          username: identifier.replace("@", ""),
        },
      },
    });

    if (!cached || !cached.lastFetchedAt || cached.lastFetchedAt < cutoff) {
      return null;
    }

    try {
      const snapshot = JSON.parse(cached.snapshotJson);
      return snapshot.metrics || null;
    } catch {
      return null;
    }
  } catch (error) {
    logError("[YOUTUBE] Error retrieving cached metrics", error, {
      identifier,
    });
    return null;
  }
}

/**
 * Track quota usage for monitoring
 */
export async function trackYouTubeQuotaUsage(
  quotaUsed: number
): Promise<void> {
  try {
    logInfo("[YOUTUBE] Quota tracked", { quotaUsed });
    // In future: Store quota usage in database for monitoring
  } catch (error) {
    logError("[YOUTUBE] Error tracking quota", error);
  }
}

export default {
  fetchYouTubeMetrics,
  trackYouTubeQuotaUsage,
};
