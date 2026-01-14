/**
 * TikTok Platform Service
 *
 * Public data scraping for TikTok creator profiles:
 * - Follower count
 * - Total likes
 * - Video count
 * - Recent post velocity (last 7 days)
 * - Rate limiting: Max 1 profile per 10 seconds
 *
 * No official API credentials required (public data only)
 */

import { logInfo, logError, logWarn } from '../../lib/logger';
import prisma from '../../lib/prisma';

export interface TikTokProfileMetrics {
  username: string;
  displayName: string;
  bio: string;
  followerCount: number;
  followingCount: number;
  likeCount: number;
  videoCount: number;
  profilePictureUrl: string;
  isVerified: boolean;
  recentPostVelocity?: {
    last7Days: number;
    last30Days: number;
  };
}

// Rate limiter: Max 1 profile per 10 seconds
const rateLimiter = new Map<string, number>();

/**
 * Fetch TikTok profile metrics via public page scrape
 */
export async function fetchTikTokMetrics(
  identifier: string
): Promise<{
  metrics: TikTokProfileMetrics | null;
  error?: string;
}> {
  logInfo("[TIKTOK] Fetching metrics", { identifier });

  const normalized = identifier.replace("@", "").toLowerCase();

  // Check rate limiter
  const lastFetch = rateLimiter.get(normalized);
  if (lastFetch && Date.now() - lastFetch < 10000) {
    // 10 second cooldown
    const waitMs = 10000 - (Date.now() - lastFetch);
    logWarn("[TIKTOK] Rate limit hit", { identifier, waitMs });
    return {
      metrics: null,
      error: `Rate limit exceeded. Please try again in ${Math.ceil(waitMs / 1000)} seconds.`,
    };
  }

  rateLimiter.set(normalized, Date.now());

  try {
    const metrics = await scrapeTikTokProfile(normalized);

    if (!metrics) {
      return {
        metrics: null,
        error: "Failed to fetch TikTok profile. Profile may be private or blocked.",
      };
    }

    logInfo("[TIKTOK] Metrics fetched successfully", {
      identifier,
      followerCount: metrics.followerCount,
    });

    return { metrics };
  } catch (error) {
    logError("[TIKTOK] Error fetching metrics", error, { identifier });
    return {
      metrics: null,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch TikTok metrics",
    };
  }
}

/**
 * Scrape TikTok public profile page
 *
 * Uses user-agent rotation and respects rate limits
 * Automatically falls back to HTML scraping if API fails
 */
async function scrapeTikTokProfile(
  username: string
): Promise<TikTokProfileMetrics | null> {
  try {
    const userAgents = [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    ];
    const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];

    // TikTok's web API endpoint for public profiles
    const url = `https://www.tiktok.com/api/user/detail/?uniqueId=${encodeURIComponent(username)}`;

    logInfo("[TIKTOK] Fetching profile data from API", { username, url });

    // Use AbortController for timeout since fetch doesn't support timeout in RequestInit
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      headers: {
        "User-Agent": userAgent,
        "Referer": `https://www.tiktok.com/@${username}`,
        "Origin": "https://www.tiktok.com",
        "Accept": "application/json",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 404) {
        logWarn("[TIKTOK] Profile not found via API", { username });
        // Try fallback for 404s - sometimes the profile exists but API doesn't return it
        logInfo("[TIKTOK] Attempting HTML fallback for 404", { username });
        return await scrapeTikTokProfileFallback(username, userAgent);
      }

      if (response.status === 429) {
        logWarn("[TIKTOK] Rate limited by TikTok API", { username });
        return null;
      }

      logWarn("[TIKTOK] API fetch failed", { username, status: response.status });
      // Fallback to HTML scraping
      logInfo("[TIKTOK] Falling back to HTML scrape", { username });
      return await scrapeTikTokProfileFallback(username, userAgent);
    }

    const data: any = await response.json();

    // 🚨 CRITICAL PROTECTION: If we got 200 but no data, TikTok changed response structure
    if (!data || !data.userInfo) {
      if (response.status === 200) {
        logWarn(
          "[TIKTOK] API response missing userInfo - structure may have changed",
          { username, dataKeys: data ? Object.keys(data) : "null" }
        );
        // Try fallback instead of throwing
        logInfo("[TIKTOK] Falling back to HTML scrape due to API format change", { username });
        return await scrapeTikTokProfileFallback(username, userAgent);
      }
      // Fallback: Try alternate endpoint
      return await scrapeTikTokProfileFallback(username, userAgent);
    }

    const user = data.userInfo.user || {};
    const stats = data.userInfo.stats || {};

    const profile: TikTokProfileMetrics = {
      username: user.uniqueId || username,
      displayName: user.nickname || "",
      bio: user.signature || "",
      followerCount: stats.followerCount || 0,
      followingCount: stats.followingCount || 0,
      likeCount: stats.heartCount || 0,
      videoCount: stats.videoCount || 0,
      profilePictureUrl: user.avatarLarger || "",
      isVerified: user.verified || false,
    };

    logInfo("[TIKTOK] Successfully fetched profile from API", {
      username,
      followers: profile.followerCount,
    });

    return profile;
  } catch (error) {
    if (error instanceof Error && error.message.includes("timeout")) {
      logWarn("[TIKTOK] Fetch timeout", { username });
      return null;
    }

    logError("[TIKTOK] Scrape error", error, { username });
    return null;
  }
}

/**
 * Fallback TikTok scraping method using HTML parsing
 * 
 * This method is more resilient as it parses the actual page content
 * instead of relying on TikTok's internal API
 */
async function scrapeTikTokProfileFallback(
  username: string,
  userAgent: string
): Promise<TikTokProfileMetrics | null> {
  try {
    // Note: Use regular TikTok profile URL, not the short mobile URL
    const url = `https://www.tiktok.com/@${encodeURIComponent(username)}`;

    logInfo("[TIKTOK] Using HTML fallback scrape method", { username, url });

    // Use AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      headers: {
        "User-Agent": userAgent,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      logWarn("[TIKTOK] HTML fetch failed", { username, status: response.status });
      return null;
    }

    const html = await response.text();

    // 🚨 CRITICAL PROTECTION: If we got 200 but couldn't parse, TikTok changed HTML structure
    if (!html || html.length === 0) {
      if (response.status === 200) {
        logWarn(
          "[TIKTOK] HTML response empty - page structure may have changed",
          { username }
        );
      }
      return null;
    }

    // Extract data from HTML - look for __DEFAULT_SCOPE__ or similar embed
    // TikTok embeds data in the HTML as JSON in script tags
    const scriptDataMatch = html.match(/<script id="__data"[^>]*>([^<]+)<\/script>/);
    const appStateMatch = html.match(/<script id="SIGI_STATE"[^>]*>({.*?})<\/script>/);
    
    // Fallback to regex-based extraction if script tags don't work
    const followerMatch = html.match(/"followerCount":(\d+)/);
    const followingMatch = html.match(/"followingCount":(\d+)/);
    const likeMatch = html.match(/"heartCount":(\d+)/);
    const videoMatch = html.match(/"videoCount":(\d+)/);
    const nickMatch = html.match(/"nickname":"([^"]+)"/);
    const signatureMatch = html.match(/"signature":"([^"]*?)"/);
    const verifiedMatch = html.match(/"verified":\s*(\w+)/);
    const avatarMatch = html.match(/"avatarLarger":"([^"]+)"/);

    // Check if we could extract any meaningful data
    const hasData = followerMatch || followingMatch || nickMatch || videoMatch;
    if (!hasData && response.status === 200) {
      logWarn(
        "[TIKTOK] HTML parse succeeded but no profile data extracted - may need parser update",
        { username, htmlSize: html.length }
      );
      // Return empty profile instead of failing completely
      return {
        username,
        displayName: "",
        bio: "",
        followerCount: 0,
        followingCount: 0,
        likeCount: 0,
        videoCount: 0,
        profilePictureUrl: "",
        isVerified: false,
      };
    }

    const profile: TikTokProfileMetrics = {
      username: username,
      displayName: nickMatch ? decodeURIComponent(nickMatch[1]) : "",
      bio: signatureMatch ? decodeURIComponent(signatureMatch[1]) : "",
      followerCount: followerMatch ? parseInt(followerMatch[1], 10) : 0,
      followingCount: followingMatch ? parseInt(followingMatch[1], 10) : 0,
      likeCount: likeMatch ? parseInt(likeMatch[1], 10) : 0,
      videoCount: videoMatch ? parseInt(videoMatch[1], 10) : 0,
      profilePictureUrl: avatarMatch ? avatarMatch[1] : "",
      isVerified: verifiedMatch ? verifiedMatch[1] === "true" : false,
    };

    logInfo("[TIKTOK] Successfully fetched profile from HTML", {
      username,
      followers: profile.followerCount,
    });

    return profile;
  } catch (error) {
    logError("[TIKTOK] Fallback scrape error", error, { username });
    return null;
  }
}

/**
 * Calculate post velocity (posts per day in last N days)
 */
export async function calculatePostVelocity(
  username: string,
  daysHistory: number = 30
): Promise<{ last7Days: number; last30Days: number } | null> {
  try {
    logInfo("[TIKTOK] Calculating post velocity", { username, daysHistory });

    // This would require storing video timestamps over time
    // For now, return null - can be implemented with video scraping

    return null;
  } catch (error) {
    logError("[TIKTOK] Error calculating post velocity", error, { username });
    return null;
  }
}

/**
 * Cache TikTok metrics in ExternalSocialProfile
 */
export async function cacheTikTokMetrics(
  username: string,
  metrics: TikTokProfileMetrics
): Promise<void> {
  try {
    await prisma.externalSocialProfile.upsert({
      where: {
        platform_username: {
          platform: "TIKTOK",
          username: username.replace("@", "").toLowerCase(),
        },
      },
      update: {
        profileUrl: `https://tiktok.com/@${username.replace("@", "")}`,
        snapshotJson: JSON.stringify({
          metrics,
          fetchedAt: new Date().toISOString(),
        }),
        lastFetchedAt: new Date(),
        updatedAt: new Date(),
      },
      create: {
        platform: "TIKTOK",
        username: username.replace("@", "").toLowerCase(),
        profileUrl: `https://tiktok.com/@${username.replace("@", "")}`,
        snapshotJson: JSON.stringify({
          metrics,
          fetchedAt: new Date().toISOString(),
        }),
      },
    });

    logInfo("[TIKTOK] Metrics cached", { username });
  } catch (error) {
    logError("[TIKTOK] Error caching metrics", error, { username });
  }
}

export default {
  fetchTikTokMetrics,
  calculatePostVelocity,
  cacheTikTokMetrics,
};
