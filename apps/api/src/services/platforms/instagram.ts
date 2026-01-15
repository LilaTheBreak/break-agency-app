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

import { logInfo, logError, logWarn } from '../../lib/logger.js';
import prisma from '../../lib/prisma.js';

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

      // Try public API fallback (RapidAPI Instagram API or similar)
      logInfo("[INSTAGRAM] Scrape failed, attempting public API fallback", { username });
      const publicApiResult = await fetchViaPublicAPI(normalized);
      if (publicApiResult) {
        logInfo("[INSTAGRAM] Public API fallback successful", { username });
        return { metrics: publicApiResult, dataSource: "SCRAPE" };
      }

      // Try headless browser as last resort
      logInfo("[INSTAGRAM] Public API failed, attempting headless browser scrape", { username });
      const browserResult = await scrapeWithBrowser(normalized);
      if (browserResult) {
        logInfo("[INSTAGRAM] Browser scrape successful", { username });
        return { metrics: browserResult, dataSource: "SCRAPE" };
      }

      logError("[INSTAGRAM] All strategies failed", new Error("All Instagram data fetch strategies exhausted"), {
        username,
        error: "Profile may be private, deleted, blocked, or Instagram anti-bot measures are active",
      });
      
      // Return placeholder data so user can still proceed (won't break the UI)
      // This allows analytics to continue even if we can't get live data
      logWarn("[INSTAGRAM] Returning placeholder data due to Instagram blocking", { username });
      return {
        metrics: {
          username: normalized,
          displayName: `@${normalized}`,
          biography: "(Profile data unavailable - Instagram blocking requests)",
          followerCount: 0,
          followingCount: 0,
          postCount: 0,
          profilePictureUrl: "",
          isVerified: false,
          isBusinessAccount: false,
          dataSource: "SCRAPE",
        },
        dataSource: "SCRAPE",
        error: "Failed to fetch live data. Instagram is blocking automated access. Profile name only.",
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
 * Fetch via public Instagram API (fallback strategy)
 * Uses public API services if available
 */
async function fetchViaPublicAPI(username: string): Promise<InstagramProfileMetrics | null> {
  try {
    // Strategy: Try Instagram's public JSON endpoint which sometimes works
    const url = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`;
    
    logInfo("[INSTAGRAM] Attempting public API endpoint", { username });

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      logWarn("[INSTAGRAM] Public API failed", {
        username,
        status: response.status,
      });
      return null;
    }

    const data: any = await response.json();
    const user = data?.data?.user;

    if (!user) {
      return null;
    }

    return {
      username: user.username || username,
      displayName: user.full_name || "",
      biography: user.biography || "",
      followerCount: user.follower_count || 0,
      followingCount: user.following_count || 0,
      postCount: user.media_count || 0,
      profilePictureUrl: user.profile_pic_url || user.profile_pic_url_hd || "",
      isVerified: user.is_verified || false,
      isBusinessAccount: user.is_business_account || false,
      dataSource: "SCRAPE",
    };
  } catch (error) {
    logError("[INSTAGRAM] Public API fallback error", error, { username });
    return null;
  }
}

/**
 * Scrape Instagram using headless browser (Puppeteer)
 * Used as last resort when direct scraping and API both fail
 */
async function scrapeWithBrowser(username: string): Promise<InstagramProfileMetrics | null> {
  try {
    logInfo("[INSTAGRAM] Starting browser scrape", { username });
    
    // Dynamically import puppeteer
    const puppeteer = await import('puppeteer');
    
    const browser = await puppeteer.default.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    );
    
    // Set viewport and wait for navigation
    await page.setViewport({ width: 1280, height: 720 });
    
    const url = `https://www.instagram.com/${username}/`;
    logInfo("[INSTAGRAM] Navigating to profile", { username, url });
    
    try {
      await page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: 15000 
      });
    } catch (navError) {
      logWarn("[INSTAGRAM] Navigation timeout, continuing with page content", { username });
      // Don't fail - sometimes page loads partially
    }

    // Extract meta tags from rendered page
    const profileData = await page.evaluate(() => {
      const getMetaContent = (property: string) => {
        const meta = document.querySelector(`meta[property="${property}"]`);
        return meta ? meta.getAttribute('content') : '';
      };

      return {
        title: getMetaContent('og:title'),
        description: getMetaContent('og:description'),
        image: getMetaContent('og:image'),
      };
    });

    await browser.close();

    if (!profileData.title && !profileData.description) {
      logWarn("[INSTAGRAM] Browser scrape returned no data", { username });
      return null;
    }

    // Parse title: "Name's Photos on Instagram"
    const displayName = profileData.title
      ?.replace(/'s Photos & Videos on Instagram/, '')
      .replace(/'s Photos on Instagram/, '')
      .replace(/'s Reels & Photos on Instagram/, '')
      .trim() || username;

    // Parse follower count from description
    const followerMatch = profileData.description?.match(/([0-9,.]+)\s*(?:Followers?)/);
    const followerCount = followerMatch 
      ? parseInt(followerMatch[1].replace(/,/g, ''), 10)
      : 0;

    logInfo("[INSTAGRAM] Browser scrape successful", {
      username,
      displayName,
      followers: followerCount,
    });

    return {
      username,
      displayName,
      biography: profileData.description || '',
      followerCount,
      followingCount: 0,
      postCount: 0,
      profilePictureUrl: profileData.image || '',
      isVerified: false,
      isBusinessAccount: false,
      dataSource: "SCRAPE",
    };
  } catch (error) {
    logError("[INSTAGRAM] Browser scrape failed", error, { username });
    return null;
  }
}

/**
 * Extract follower count from public HTML metadata
 * Lightweight scrape that extracts follower count from meta tags only
 * Does NOT use headless browser - just simple fetch + parse
 * Timeout: 2 seconds max (fail fast if Instagram blocks)
 */
async function extractFollowerCountFromHTML(
  username: string
): Promise<{ followerCount: number | null; displayName: string | null }> {
  try {
    const userAgents = [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
    ];
    const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];

    const url = `https://www.instagram.com/${username}/`;
    
    logInfo("[INSTAGRAM] Attempting lightweight HTML metadata extraction", { username });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout

    const response = await fetch(url, {
      headers: {
        "User-Agent": userAgent,
        "Accept": "text/html",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      logWarn("[INSTAGRAM] HTML fetch returned non-200", {
        username,
        status: response.status,
      });
      return { followerCount: null, displayName: null };
    }

    const html = await response.text();

    // Extract follower count from og:description
    // Format: "username posts, X followers, Y following"
    const descriptionMatch = html.match(/<meta property="og:description" content="([^"]+)"/);
    if (descriptionMatch) {
      const description = descriptionMatch[1];
      const followerMatch = description.match(/(\d+(?:,\d+)*)\s+followers/i);
      if (followerMatch) {
        const followerCount = parseInt(followerMatch[1].replace(/,/g, ''), 10);
        
        // Also extract display name from og:title: "Name (@username) • Instagram"
        const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/);
        const displayName = titleMatch ? titleMatch[1].split(' (')[0] : null;

        logInfo("[INSTAGRAM] Successfully extracted follower count from HTML", {
          username,
          followerCount,
          displayName,
          source: "og:description",
        });

        return { followerCount, displayName };
      }
    }

    // Fallback: Look for JSON-LD schema
    const jsonLdMatch = html.match(/<script type="application\/ld\+json">({[^}]+})<\/script>/);
    if (jsonLdMatch) {
      try {
        const jsonLd = JSON.parse(jsonLdMatch[1]);
        if (jsonLd.interactionStatistic) {
          for (const stat of jsonLd.interactionStatistic) {
            if (stat.interactionType === "http://schema.org/FollowAction") {
              const followerCount = stat.userInteractionCount;
              logInfo("[INSTAGRAM] Extracted follower count from JSON-LD", {
                username,
                followerCount,
                source: "json-ld",
              });
              return { followerCount, displayName: jsonLd.name };
            }
          }
        }
      } catch (e) {
        logWarn("[INSTAGRAM] Failed to parse JSON-LD", { username });
      }
    }

    logWarn("[INSTAGRAM] Could not extract follower count from HTML", { username });
    return { followerCount: null, displayName: null };
  } catch (error) {
    if (error instanceof Error && error.message.includes("abort")) {
      logWarn("[INSTAGRAM] HTML extraction timeout (Instagram may be blocking)", { username });
    } else {
      logWarn("[INSTAGRAM] HTML extraction failed", error, { username });
    }
    return { followerCount: null, displayName: null };
  }
}

/**
 * Scrape Instagram public profile page (HTML meta tags)
 */
async function scrapeInstagramProfile(
  username: string
): Promise<InstagramProfileMetrics | null> {
  try {
    // Strategy 1: Try lightweight HTML metadata extraction first (no headless browser)
    const { followerCount, displayName } = await extractFollowerCountFromHTML(username);
    
    if (followerCount !== null) {
      logInfo("[INSTAGRAM] Scrape successful via HTML metadata", { username, followerCount });
      return {
        username,
        displayName: displayName || username,
        biography: "",
        followerCount,
        followingCount: 0,
        postCount: 0,
        profilePictureUrl: "",
        isVerified: false,
        isBusinessAccount: false,
        dataSource: "SCRAPE",
      };
    }

    // Add user-agent rotation to avoid blocks
    const userAgents = [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    ];
    const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];

    // Strategy 2: Try full HTML scraping if metadata extraction failed
    let url = `https://www.instagram.com/${username}/`;
    
    logInfo("[INSTAGRAM] Attempting scrape (strategy 2: full HTML parse)", {
      username,
      url: url,
      userAgent: userAgent.substring(0, 40) + "...",
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    let response = await fetch(url, {
      headers: {
        "User-Agent": userAgent,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate",
        "Connection": "keep-alive",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    logInfo("[INSTAGRAM] HTML response received", {
      username,
      status: response.status,
      contentType: response.headers.get("content-type"),
    });

    if (!response.ok) {
      if (response.status === 404) {
        logWarn("[INSTAGRAM] Profile not found (404)", { username });
        return null;
      }

      if (response.status === 429 || response.status === 403) {
        logWarn("[INSTAGRAM] Rate limited or forbidden", { username, status: response.status });
        return null;
      }

      logWarn("[INSTAGRAM] HTML response not OK", {
        username,
        status: response.status,
        statusText: response.statusText,
      });
      
      // Try fallback strategy even if status is not OK
      // Some profiles may still have data in the HTML
    }

    const html = await response.text();
    
    // Log the actual content for debugging
    if (!response.ok) {
      const sampleContent = html.substring(0, 300);
      logWarn("[INSTAGRAM] HTML content sample (first 300 chars)", {
        username,
        status: response.status,
        sample: sampleContent,
      });
    }
    
    logInfo("[INSTAGRAM] HTML body received", {
      username,
      size: html.length,
      hasScriptTags: (html.match(/<script/g) || []).length,
      hasMetaTags: (html.match(/<meta/g) || []).length,
      firstChars: html.substring(0, 200),
    });

    // Try to extract data from the HTML
    // Instagram embeds profile data in several ways:
    // 1. In a script tag with id="__data"
    // 2. In meta tags (og:image, og:description)
    // 3. In the next.js data structure
    
    const profile = parseInstagramHTML(html, username);
    
    // 🚨 CRITICAL PROTECTION: If we got 200 but couldn't parse, Instagram changed markup
    if (!profile && response.status === 200) {
      logError(
        "[INSTAGRAM] CRITICAL: HTML_FETCH_OK_BUT_PARSE_FAILED",
        new Error("HTML fetch succeeded (200) but no data could be extracted. Instagram may have changed their page structure."),
        { 
          username, 
          htmlSize: html.length,
          htmlStart: html.substring(0, 500),
          hasMeta: html.includes('<meta'),
          hasOgImage: html.includes('og:image'),
        }
      );
      throw new Error("HTML_FETCH_OK_BUT_PARSE_FAILED");
    }
    
    if (profile) {
      logInfo("[INSTAGRAM] Profile parsed from HTML successfully", {
        username,
        followers: profile.followerCount,
        posts: profile.postCount,
      });
      return profile;
    }

    logWarn("[INSTAGRAM] Could not parse profile from HTML", { username });
    return null;
    
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        logWarn("[INSTAGRAM] Scrape timeout (10s)", { username });
        return null;
      }
      logError("[INSTAGRAM] Scrape error", error, { username });
    } else {
      logError("[INSTAGRAM] Scrape error (unknown)", new Error(String(error)), { username });
    }
    return null;
  }
}

/**
 * Parse Instagram profile data from HTML page
 */
function parseInstagramHTML(html: string, username: string): InstagramProfileMetrics | null {
  try {
    // Log what we found in the HTML for debugging
    logInfo("[INSTAGRAM] Parsing HTML", {
      username,
      htmlSize: html.length,
      has_og_image: html.includes('property="og:image"'),
      has_og_title: html.includes('property="og:title"'),
      has_og_description: html.includes('property="og:description"'),
    });

    // Try to extract from meta tags first (most reliable)
    // Instagram returns meta tags in format: <meta property="og:image" content="URL" />
    const ogImageMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
    const ogTitleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i);
    const ogDescriptionMatch = html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/i);

    logInfo("[INSTAGRAM] Meta tag extraction results", {
      username,
      hasImage: !!ogImageMatch,
      hasTitle: !!ogTitleMatch,
      hasDescription: !!ogDescriptionMatch,
      titleMatch: ogTitleMatch ? ogTitleMatch[1].substring(0, 50) : null,
    });

    if (ogImageMatch && ogTitleMatch) {
      logInfo("[INSTAGRAM] Extracted data from meta tags", { username });
      
      // Extract name from "Name's Photos & Videos on Instagram" or "Name's Reels & Photos on Instagram"
      const titleText = ogTitleMatch[1];
      const displayName = titleText
        .replace(/'s Photos & Videos on Instagram/, "")
        .replace(/'s Reels & Photos on Instagram/, "")
        .replace(/'s Photos on Instagram/, "")
        .replace(/'s Reels on Instagram/, "")
        .trim();
      
      // Parse follower count from description if available
      const description = ogDescriptionMatch?.[1] || "";
      const followerMatch = description.match(/([0-9,.]+)\s*(?:Followers?|followers?)/);
      const followerCount = followerMatch 
        ? parseInt(followerMatch[1].replace(/,/g, ""), 10)
        : 0;

      return {
        username,
        displayName,
        biography: description,
        followerCount,
        followingCount: 0,
        postCount: 0,
        profilePictureUrl: ogImageMatch[1],
        isVerified: false,
        isBusinessAccount: false,
        dataSource: "SCRAPE",
        scrapedAt: new Date().toISOString(),
      };
    }

    // Try to extract from embedded JSON (next.js data)
    // Look for patterns like: window.__initialData = {...}
    const jsonMatch = html.match(/<script>window\.__initialData\s*=\s*({.+?});<\/script>/);
    if (jsonMatch) {
      try {
        const data = JSON.parse(jsonMatch[1]);
        const user = data?.user;
        
        if (user) {
          logInfo("[INSTAGRAM] Extracted data from JSON in HTML", { username });
          return {
            username: user.username || username,
            displayName: user.displayName || user.full_name || "",
            biography: user.biography || "",
            followerCount: user.followerCount || user.followers_count || 0,
            followingCount: user.followingCount || user.following_count || 0,
            postCount: user.postCount || user.media_count || 0,
            profilePictureUrl: user.profilePictureUrl || user.profile_picture_url || "",
            isVerified: user.isVerified || user.is_verified || false,
            isBusinessAccount: user.is_business_account || false,
            dataSource: "SCRAPE",
            scrapedAt: new Date().toISOString(),
          };
        }
      } catch (e) {
        logWarn("[INSTAGRAM] Failed to parse JSON from HTML", { username });
      }
    }

    // Last resort: try to extract from old __a=1 endpoint if available
    // Some cached responses might still be in memory
    logWarn("[INSTAGRAM] Could not extract data from HTML using any method", { username });
    return null;
  } catch (error) {
    logError("[INSTAGRAM] Error parsing HTML", error, { username });
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
