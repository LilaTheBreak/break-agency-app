/**
 * Analytics Ingestion Service
 * 
 * Handles:
 * - Input normalization (URLs, @usernames)
 * - Data fetching from platforms
 * - Database persistence
 * - Sync management with caching
 */

import prisma from "../lib/prisma.js";
import { logInfo, logError } from "../lib/logger.js";
import { fetchYouTubeMetrics } from "./platforms/youtube.js";
import { fetchInstagramMetrics } from "./platforms/instagram.js";
import { fetchTikTokMetrics } from "./platforms/tiktok.js";

// ============================================================================
// NORMALIZATION
// ============================================================================

export interface NormalizedSocialInput {
  platform: "INSTAGRAM" | "TIKTOK" | "YOUTUBE";
  username: string;
  canonicalUrl: string;
  isValid: boolean;
  error?: string;
}

/**
 * Normalize any social input (URL or @username) into canonical form
 * Supports:
 * - instagram.com/username
 * - @username
 * - tiktok.com/@username
 * - youtube.com/@channel
 */
export function normalizeSocialInput(input: string): NormalizedSocialInput {
  logInfo("[ANALYTICS] Normalizing input", { input: input.substring(0, 50) });

  if (!input || typeof input !== "string") {
    return {
      platform: "INSTAGRAM",
      username: "",
      canonicalUrl: "",
      isValid: false,
      error: "Input is empty or not a string",
    };
  }

  const trimmed = input.trim().toLowerCase();

  // Remove common URL prefixes
  const urlPattern = /^(?:https?:\/\/)?(?:www\.)?/;
  const cleaned = trimmed.replace(urlPattern, "");

  // Instagram
  if (
    trimmed.includes("instagram.com") ||
    trimmed.includes("insta.com") ||
    (cleaned.startsWith("instagram.com") && !cleaned.includes("/p/"))
  ) {
    // Match username, handling query parameters like ?hl=en
    const match = cleaned.match(/instagram\.com\/([a-z0-9._-]+)(?:\?|\/|$)/i);
    if (match) {
      const username = match[1];
      return {
        platform: "INSTAGRAM",
        username,
        canonicalUrl: `https://instagram.com/${username}`,
        isValid: true,
      };
    }
  }

  // TikTok
  if (trimmed.includes("tiktok.com") || trimmed.includes("vm.tiktok.com")) {
    // Match @username format, handling query parameters like ?lang=en
    const match = cleaned.match(/tiktok\.com\/@?([a-z0-9._-]+)(?:\?|\/|$)/i);
    if (match) {
      const username = match[1].replace(/^@/, "");
      return {
        platform: "TIKTOK",
        username,
        canonicalUrl: `https://tiktok.com/@${username}`,
        isValid: true,
      };
    }
  }

  // YouTube
  if (
    trimmed.includes("youtube.com") ||
    trimmed.includes("youtu.be") ||
    trimmed.includes("yt.be")
  ) {
    // Try @channel format, handling query parameters
    let match = cleaned.match(/youtube\.com\/@([a-z0-9._-]+)(?:\?|\/|$)/i);
    if (match) {
      const username = match[1];
      return {
        platform: "YOUTUBE",
        username,
        canonicalUrl: `https://youtube.com/@${username}`,
        isValid: true,
      };
    }

    // Try /c/ format, handling query parameters
    match = cleaned.match(/youtube\.com\/c\/([a-z0-9._-]+)(?:\?|\/|$)/i);
    if (match) {
      const username = match[1];
      return {
        platform: "YOUTUBE",
        username,
        canonicalUrl: `https://youtube.com/c/${username}`,
        isValid: true,
      };
    }

    // Try /user/ format, handling query parameters
    match = cleaned.match(/youtube\.com\/user\/([a-z0-9._-]+)(?:\?|\/|$)/i);
    if (match) {
      const username = match[1];
      return {
        platform: "YOUTUBE",
        username,
        canonicalUrl: `https://youtube.com/user/${username}`,
        isValid: true,
      };
    }
  }

  // Handle @username format
  if (trimmed.startsWith("@")) {
    const username = trimmed.substring(1);
    // Default to Instagram for @username format
    return {
      platform: "INSTAGRAM",
      username,
      canonicalUrl: `https://instagram.com/${username}`,
      isValid: true,
    };
  }

  // Single word - assume Instagram
  if (/^[a-z0-9._-]+$/.test(trimmed)) {
    return {
      platform: "INSTAGRAM",
      username: trimmed,
      canonicalUrl: `https://instagram.com/${trimmed}`,
      isValid: true,
    };
  }

  return {
    platform: "INSTAGRAM",
    username: "",
    canonicalUrl: "",
    isValid: false,
    error: "Could not parse input as valid social profile",
  };
}

// ============================================================================
// DATA FETCHING (PLATFORM ADAPTERS)
// ============================================================================

interface InstagramProfile {
  username: string;
  displayName?: string;
  bio?: string;
  followerCount: number;
  followingCount?: number;
  postCount?: number;
  profileImageUrl?: string;
  isVerified?: boolean;
  externalId?: string;
}

interface InstagramPost {
  externalId: string;
  caption?: string;
  mediaType: string;
  mediaUrl?: string;
  thumbnailUrl?: string;
  permalink?: string;
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
  shareCount?: number;
  postedAt: Date;
}

/**
 * Fetch Instagram profile data
 * Uses public scraping or API based on available tokens
 */
export async function fetchInstagramProfile(
  username: string
): Promise<{ profile: InstagramProfile; error?: string }> {
  logInfo("[ANALYTICS] Fetching Instagram profile", { username });

  try {
    // Call the Instagram platform service
    const result = await fetchInstagramMetrics(username);

    logInfo("[ANALYTICS] Instagram metrics result", {
      username,
      metricsAvailable: !!result.metrics,
      dataSource: result.dataSource,
      error: result.error,
    });

    if (!result.metrics) {
      logError("[ANALYTICS] Instagram metrics not found", result.error || "Unknown error", { username });
      return {
        profile: { username, followerCount: 0 },
        error: result.error || "Failed to fetch Instagram metrics",
      };
    }

    // Transform response to match expected profile format
    const metrics = result.metrics;
    const profile: InstagramProfile = {
      username: metrics.username,
      displayName: metrics.displayName,
      bio: metrics.biography,
      followerCount: metrics.followerCount || 0,
      followingCount: metrics.followingCount,
      postCount: metrics.postCount,
      profileImageUrl: metrics.profilePictureUrl,
      isVerified: metrics.isVerified,
    };

    logInfo("[ANALYTICS] Instagram profile transformed", {
      username,
      followers: profile.followerCount,
      posts: profile.postCount,
      verified: profile.isVerified,
      source: result.dataSource || "SCRAPE",
    });

    return { profile };
  } catch (error) {
    logError("[ANALYTICS] Failed to fetch Instagram profile", error, {
      username,
    });
    return {
      profile: { username, followerCount: 0 },
      error: `Failed to fetch Instagram data: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

interface TikTokProfile {
  username: string;
  displayName?: string;
  bio?: string;
  followerCount: number;
  followingCount?: number;
  videoCount?: number;
  heartCount?: number;
  profileImageUrl?: string;
  isVerified?: boolean;
  externalId?: string;
}

interface TikTokPost {
  externalId: string;
  caption?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  permalink?: string;
  playCount?: number;
  likeCount?: number;
  commentCount?: number;
  shareCount?: number;
  postedAt: Date;
}

/**
 * Fetch TikTok profile data
 */
export async function fetchTikTokProfile(
  username: string
): Promise<{ profile: TikTokProfile; error?: string }> {
  logInfo("[ANALYTICS] Fetching TikTok profile", { username });

  try {
    // Call the TikTok platform service
    const result = await fetchTikTokMetrics(username);

    if (!result.metrics) {
      logError("[ANALYTICS] TikTok metrics not found", result.error, { username });
      return {
        profile: { username, followerCount: 0 },
        error: result.error || "Failed to fetch TikTok metrics",
      };
    }

    // Transform response to match expected profile format
    const metrics = result.metrics;
    const profile: TikTokProfile = {
      username: metrics.username,
      displayName: metrics.displayName,
      bio: metrics.bio,
      followerCount: metrics.followerCount || 0,
      followingCount: metrics.followingCount,
      videoCount: metrics.videoCount,
      heartCount: metrics.likeCount,
      profileImageUrl: metrics.profilePictureUrl,
      isVerified: metrics.isVerified,
    };

    logInfo("[ANALYTICS] TikTok profile fetched", {
      username,
      followers: profile.followerCount,
    });

    return { profile };
  } catch (error) {
    logError("[ANALYTICS] Failed to fetch TikTok profile", error, { username });
    return {
      profile: { username, followerCount: 0 },
      error: `Failed to fetch TikTok data: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

interface YouTubeProfile {
  username: string;
  displayName?: string;
  description?: string;
  subscriberCount?: number;
  videoCount?: number;
  viewCount?: number;
  profileImageUrl?: string;
  bannerImageUrl?: string;
  customUrl?: string;
  externalId?: string;
}

interface YouTubeVideo {
  externalId: string;
  title?: string;
  description?: string;
  thumbnailUrl?: string;
  permalink?: string;
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
  duration?: string;
  publishedAt: Date;
}

/**
 * Fetch YouTube channel data using YouTube Data API v3
 */
export async function fetchYouTubeProfile(
  channel: string
): Promise<{ profile: YouTubeProfile; error?: string }> {
  logInfo("[ANALYTICS] Fetching YouTube profile", { channel });

  try {
    const apiKey = process.env.GOOGLE_YOUTUBE_API_KEY;
    if (!apiKey) {
      logInfo("[ANALYTICS] YouTube API key not configured");
      return {
        profile: { username: channel },
        error: "YouTube API not configured. Set GOOGLE_YOUTUBE_API_KEY.",
      };
    }

    // Check if channel is a handle (@) or channel ID
    let searchQuery = channel;
    if (channel.startsWith("@")) {
      searchQuery = channel.substring(1);
    }

    // Search for channel
    const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
    searchUrl.searchParams.append("part", "snippet");
    searchUrl.searchParams.append("q", searchQuery);
    searchUrl.searchParams.append("type", "channel");
    searchUrl.searchParams.append("key", apiKey);
    searchUrl.searchParams.append("maxResults", "1");

    const searchResponse = await fetch(searchUrl.toString());
    if (!searchResponse.ok) {
      throw new Error(`YouTube search failed: ${searchResponse.statusText}`);
    }

    const searchData = await searchResponse.json();
    if (!searchData.items || searchData.items.length === 0) {
      logInfo("[ANALYTICS] YouTube channel not found", { channel });
      return {
        profile: { username: channel },
        error: `YouTube channel not found: ${channel}`,
      };
    }

    const channelId = searchData.items[0].id.channelId;

    // Fetch channel statistics
    const statsUrl = new URL("https://www.googleapis.com/youtube/v3/channels");
    statsUrl.searchParams.append("part", "snippet,statistics");
    statsUrl.searchParams.append("id", channelId);
    statsUrl.searchParams.append("key", apiKey);

    const statsResponse = await fetch(statsUrl.toString());
    if (!statsResponse.ok) {
      throw new Error(`YouTube stats fetch failed: ${statsResponse.statusText}`);
    }

    const statsData = await statsResponse.json();
    if (!statsData.items || statsData.items.length === 0) {
      throw new Error("Channel statistics not found");
    }

    const channelData = statsData.items[0];
    const snippet = channelData.snippet || {};
    const stats = channelData.statistics || {};

    const profile: YouTubeProfile = {
      username: channel,
      displayName: snippet.title,
      description: snippet.description,
      subscriberCount: parseInt(stats.subscriberCount || "0"),
      videoCount: parseInt(stats.videoCount || "0"),
      viewCount: parseInt(stats.viewCount || "0"),
      profileImageUrl: snippet.thumbnails?.medium?.url,
      externalId: channelId,
    };

    logInfo("[ANALYTICS] YouTube profile fetched", {
      channel,
      subscribers: profile.subscriberCount,
    });

    return { profile };
  } catch (error) {
    logError("[ANALYTICS] Failed to fetch YouTube profile", error, { channel });
    return {
      profile: { username: channel },
      error: `Failed to fetch YouTube data: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

// ============================================================================
// SYNC & PERSISTENCE
// ============================================================================

interface SyncOptions {
  forceRefresh?: boolean;
  maxAge?: number; // in hours, default 12
}

/**
 * Sync external social profile
 * Creates/updates ExternalSocialProfile and caches data
 */
export async function syncExternalProfile(
  normalizedInput: NormalizedSocialInput,
  options: SyncOptions = {}
): Promise<{
  profile: any;
  error?: string;
  cached: boolean;
}> {
  if (!normalizedInput.isValid) {
    return {
      profile: null,
      error: normalizedInput.error || "Invalid input",
      cached: false,
    };
  }

  const { platform, username, canonicalUrl } = normalizedInput;
  const { forceRefresh = false, maxAge = 12 } = options;

  logInfo("[ANALYTICS] Starting external profile sync", {
    platform,
    username,
  });

  try {
    // Check if profile exists and is fresh
    const existingProfile = await prisma.externalSocialProfile.findFirst({
      where: {
        platform,
        username,
      },
    });

    // Use cache if available and not stale
    if (existingProfile && !forceRefresh) {
      const age =
        (Date.now() - existingProfile.lastFetchedAt.getTime()) / (1000 * 60 * 60);
      if (age < maxAge) {
        logInfo("[ANALYTICS] Using cached profile", {
          platform,
          username,
          ageHours: Math.round(age),
        });
        return {
          profile: existingProfile,
          cached: true,
        };
      }
    }

    // Fetch fresh data
    let fetchedData: any = null;
    let fetchError: string | undefined;

    switch (platform) {
      case "INSTAGRAM":
        const igResult = await fetchInstagramProfile(username);
        fetchedData = igResult.profile;
        fetchError = igResult.error;
        break;

      case "TIKTOK":
        const ttResult = await fetchTikTokProfile(username);
        fetchedData = ttResult.profile;
        fetchError = ttResult.error;
        break;

      case "YOUTUBE":
        const ytResult = await fetchYouTubeProfile(username);
        fetchedData = ytResult.profile;
        fetchError = ytResult.error;
        break;
    }

    if (fetchError) {
      logInfo("[ANALYTICS] No data available", {
        platform,
        username,
        reason: fetchError,
      });
    }

    // Create or update profile record
    const profileData = {
      platform,
      username,
      profileUrl: canonicalUrl,
      lastFetchedAt: new Date(),
      snapshotJson: JSON.stringify({
        ...fetchedData,
        fetchedAt: new Date().toISOString(),
        error: fetchError,
      }),
    };

    let profile;
    if (existingProfile) {
      profile = await prisma.externalSocialProfile.update({
        where: { id: existingProfile.id },
        data: profileData,
      });
      logInfo("[ANALYTICS] Updated external profile", { platform, username });
    } else {
      profile = await prisma.externalSocialProfile.create({
        data: profileData,
      });
      logInfo("[ANALYTICS] Created external profile", { platform, username });
    }

    return {
      profile,
      error: fetchError,
      cached: false,
    };
  } catch (error) {
    logError("[ANALYTICS] Failed to sync external profile", error, {
      platform,
      username,
    });
    return {
      profile: null,
      error: `Sync failed: ${error instanceof Error ? error.message : String(error)}`,
      cached: false,
    };
  }
}

/**
 * Build analytics response from fetched data
 */
export function buildAnalyticsFromProfile(profileData: any) {
  const snapshot = profileData.snapshotJson
    ? JSON.parse(profileData.snapshotJson)
    : {};

  return {
    profile: {
      platform: profileData.platform,
      username: profileData.username,
      displayName: snapshot.displayName || profileData.username,
      profileImage: snapshot.profileImageUrl,
      followerCount: snapshot.followerCount || 0,
      isExternal: true,
    },
    overview: {
      totalReach: snapshot.followerCount || 0,
      engagementRate: snapshot.engagementRate || 0,
      postsPerWeek: snapshot.postCount ? Math.round((snapshot.postCount || 0) / 4) : 0,
      sentimentScore: 0, // To be implemented
    },
    content: {
      topPosts: [],
    },
    audience: {
      commentVolume: 0,
      responseRate: 0,
      communityTemp: "neutral",
      consistencyScore: 0,
    },
    keywords: [],
    adminNotes: null,
    syncStatus: "idle",
    updatedAt: profileData.lastFetchedAt,
    error: snapshot.error,
  };
}
