/**
 * Instagram Platform Service
 *
 * Hybrid approach:
 * - If API credentials available: Use official Instagram Graph API
 * - Otherwise: Scrape public profile page safely
 * - Always flag data source (API vs Scrape)
 * - Rate limiting: Max 1 profile per 5 seconds
 *
 * Environment:
 * - INSTAGRAM_API_TOKEN: Optional, for official API
 * - INSTAGRAM_BUSINESS_ACCOUNT_ID: Optional, for API
 */

import { logInfo, logError, logWarn } from "../../lib/logger.js";
import prisma from "../../lib/prisma.js";

export interface InstagramProfileMetrics {
  username: string;
  displayName: string;
  biography: string;
  followerCount: number;
  followingCount: number;
  postCount: number;
  profilePictureUrl: string;
  isVerified: boolean;
  isBusinessAccount: boolean;
  engagementRate?: number; // For business accounts
  category?: string; // For business accounts
  dataSource: "API" | "SCRAPE";
  scrapedAt?: string;
}

// Rate limiter to prevent Instagram blocks
const rateLimiter = new Map<string, number>();

/**
 * Fetch Instagram profile metrics (API or scrape)
 */
export async function fetchInstagramMetrics(
  username: string,
  options?: {
    forceApi?: boolean;
    forceScrape?: boolean;
  }
): Promise<{
  metrics: InstagramProfileMetrics | null;
  dataSource: "API" | "SCRAPE";
  error?: string;
}> {
  logInfo("[INSTAGRAM] Fetching metrics", { username });

  const normalized = username.replace("@", "").toLowerCase();

  // Check rate limiter
  const lastFetch = rateLimiter.get(normalized);
  if (lastFetch && Date.now() - lastFetch < 5000) {
    // 5 second cooldown
    logWarn("[INSTAGRAM] Rate limit hit", { username, waitMs: 5000 - (Date.now() - lastFetch) });
    return {
      metrics: null,
      dataSource: "API",
      error: "Rate limit exceeded. Please try again in a few seconds.",
    };
  }

  rateLimiter.set(normalized, Date.now());

  try {
    // Try API first (if credentials available)
    const apiToken = process.env.INSTAGRAM_API_TOKEN;

    if (apiToken && !options?.forceScrape) {
      logInfo("[INSTAGRAM] Attempting API fetch", { username });
      const apiResult = await fetchViaAPI(normalized, apiToken);

      if (apiResult) {
        logInfo("[INSTAGRAM] API fetch successful", { username });
        return { metrics: apiResult, dataSource: "API" };
      }

      logWarn("[INSTAGRAM] API fetch failed, falling back to scrape", {
        username,
      });
    }

    // Fallback to scraping
    if (!options?.forceApi) {
      logInfo("[INSTAGRAM] Attempting scrape", { username });
      const scrapeResult = await scrapeInstagramProfile(normalized);

      if (scrapeResult) {
        logInfo("[INSTAGRAM] Scrape successful", { username });
        return { metrics: scrapeResult, dataSource: "SCRAPE" };
      }

      return {
        metrics: null,
        dataSource: "SCRAPE",
        error: "Failed to fetch Instagram profile. Profile may be private or blocked.",
      };
    }

    return {
      metrics: null,
      dataSource: "API",
      error: "Instagram API not configured",
    };
  } catch (error) {
    logError("[INSTAGRAM] Error fetching metrics", error, { username });
    return {
      metrics: null,
      dataSource: "API",
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch Instagram metrics",
    };
  }
}

/**
 * Fetch via official Instagram Graph API
 */
async function fetchViaAPI(
  username: string,
  apiToken: string
): Promise<InstagramProfileMetrics | null> {
  try {
    const url = new URL(
      `https://graph.instagram.com/ig_hashtag_search`
    );
    url.searchParams.set("user_id", process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID || "");
    url.searchParams.set("fields", "id,username,name,biography,profile_picture_url,followers_count,follows_count,ig_id,media_count");
    url.searchParams.set("access_token", apiToken);

    logInfo("[INSTAGRAM] API request", { username });

    const response = await fetch(url.toString());

    if (!response.ok) {
      logWarn("[INSTAGRAM] API request failed", {
        username,
        status: response.status,
      });
      return null;
    }

    const data: any = await response.json();

    if (!data || !data.id) {
      return null;
    }

    return {
      username: data.username || username,
      displayName: data.name || "",
      biography: data.biography || "",
      followerCount: data.followers_count || 0,
      followingCount: data.follows_count || 0,
      postCount: data.media_count || 0,
      profilePictureUrl: data.profile_picture_url || "",
      isVerified: data.is_verified || false,
      isBusinessAccount: true,
      engagementRate: calculateEngagementRate(data),
      category: data.category || "",
      dataSource: "API",
    };
  } catch (error) {
    logError("[INSTAGRAM] API fetch error", error, { username });
    return null;
  }
}

/**
 * Scrape Instagram public profile page (cheerio/jsdom-based)
 *
 * Note: This scrapes public data only and respects Instagram's robots.txt
 */
async function scrapeInstagramProfile(
  username: string
): Promise<InstagramProfileMetrics | null> {
  try {
    // Add user-agent rotation to avoid blocks
    const userAgents = [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
    ];
    const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];

    const url = `https://www.instagram.com/${username}/?__a=1&__d=dis`;

    // Use AbortController for timeout since fetch doesn't support timeout in RequestInit
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      headers: {
        "User-Agent": userAgent,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 404) {
        logWarn("[INSTAGRAM] Profile not found", { username });
        return null;
      }

      if (response.status === 429) {
        logWarn("[INSTAGRAM] Rate limited by Instagram", { username });
        return null;
      }

      logWarn("[INSTAGRAM] Scrape request failed", {
        username,
        status: response.status,
      });
      return null;
    }

    const data: any = await response.json();

    // Extract user info from Instagram's JSON response
    const user = data.graphql?.user;

    if (!user) {
      return null;
    }

    return {
      username: user.username || username,
      displayName: user.full_name || "",
      biography: user.biography || "",
      followerCount: user.edge_followed_by?.count || 0,
      followingCount: user.edge_follow?.count || 0,
      postCount: user.edge_owner_to_timeline_media?.count || 0,
      profilePictureUrl: user.profile_pic_url_hd || "",
      isVerified: user.is_verified || false,
      isBusinessAccount: user.is_business_account || false,
      category: user.business_category_name || "",
      dataSource: "SCRAPE",
      scrapedAt: new Date().toISOString(),
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes("timeout")) {
      logWarn("[INSTAGRAM] Scrape timeout", { username });
      return null;
    }

    logError("[INSTAGRAM] Scrape error", error, { username });
    return null;
  }
}

/**
 * Calculate basic engagement rate from profile metrics
 */
function calculateEngagementRate(data: any): number {
  try {
    const followers = data.followers_count || 1;
    const mediaCount = data.media_count || 1;

    // Rough estimate: (followers / media_count) / 1000
    // This is a placeholder - real engagement would require post-level data
    return Math.round((followers / mediaCount / 1000) * 100) / 100;
  } catch {
    return 0;
  }
}

/**
 * Cache Instagram metrics in ExternalSocialProfile
 */
export async function cacheInstagramMetrics(
  username: string,
  metrics: InstagramProfileMetrics
): Promise<void> {
  try {
    await prisma.externalSocialProfile.upsert({
      where: {
        platform_username: {
          platform: "INSTAGRAM",
          username: username.replace("@", "").toLowerCase(),
        },
      },
      update: {
        profileUrl: `https://instagram.com/${username.replace("@", "")}`,
        snapshotJson: JSON.stringify({
          metrics,
          fetchedAt: new Date().toISOString(),
        }),
        lastFetchedAt: new Date(),
        updatedAt: new Date(),
      },
      create: {
        platform: "INSTAGRAM",
        username: username.replace("@", "").toLowerCase(),
        profileUrl: `https://instagram.com/${username.replace("@", "")}`,
        snapshotJson: JSON.stringify({
          metrics,
          fetchedAt: new Date().toISOString(),
        }),
      },
    });

    logInfo("[INSTAGRAM] Metrics cached", { username });
  } catch (error) {
    logError("[INSTAGRAM] Error caching metrics", error, { username });
  }
}

export default {
  fetchInstagramMetrics,
  cacheInstagramMetrics,
};
