/**
 * Instagram Public Profile Scraper
 * 
 * Fetches publicly available Instagram profile data without authentication.
 * Extracts data from embedded JSON and meta tags.
 * 
 * NOTE: This scraper will be replaced with the official Instagram API when available.
 * Currently uses public HTML parsing only - no API credentials required.
 * 
 * Data extracted:
 * - username
 * - displayName
 * - profileImageUrl
 * - followers count
 * - following count
 * - postCount
 * 
 * Resilience:
 * - Timeouts at 5s
 * - Returns null on any failure (non-blocking)
 * - Never throws - wraps all errors internally
 */

export interface InstagramProfileData {
  username: string;
  displayName?: string;
  profileImageUrl?: string;
  followers?: number;
  following?: number;
  postCount?: number;
}

/**
 * Scrape public Instagram profile data
 * @param username Instagram username (without @ or URL)
 * @returns Profile data or null if scrape fails
 */
export async function scrapeInstagramProfile(username: string): Promise<InstagramProfileData | null> {
  // Validate username format
  const cleanUsername = username.replace(/^@/, "").toLowerCase();
  if (!cleanUsername || !/^[a-z0-9_.]+$/.test(cleanUsername)) {
    return null;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

  try {
    const url = `https://www.instagram.com/${cleanUsername}/`;
    
    // Fetch the public profile page
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      // 404 means user doesn't exist
      return null;
    }

    const html = await response.text();

    // Extract data from embedded JSON in the page
    // Instagram embeds profile data in script tags as JSON
    const profileData = extractProfileFromHTML(html, cleanUsername);

    return profileData;
  } catch (error) {
    // Silently fail - network errors, timeouts, parsing errors all return null
    // Log only in development for debugging
    if (process.env.NODE_ENV === "development") {
      console.log(`[Instagram Scraper] Failed to scrape @${cleanUsername}:`, 
        error instanceof Error ? error.message : "Unknown error"
      );
    }
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Extract profile data from Instagram HTML
 * Looks for data in multiple locations for resilience
 */
function extractProfileFromHTML(html: string, username: string): InstagramProfileData | null {
  try {
    // Method 1: Look for shared_data JSON in window.__INITIAL_STATE__
    const initialStateMatch = html.match(/window\.__INITIAL_STATE__\s*=\s*({.*?});<\/script>/);
    if (initialStateMatch) {
      try {
        const data = JSON.parse(initialStateMatch[1]);
        const profileData = extractFromInitialState(data, username);
        if (profileData) return profileData;
      } catch {
        // Continue to next method
      }
    }

    // Method 2: Look for data in script tags with type="application/ld+json"
    const ldJsonMatch = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s);
    if (ldJsonMatch) {
      try {
        const data = JSON.parse(ldJsonMatch[1]);
        const profileData = extractFromLDJSON(data, username);
        if (profileData) return profileData;
      } catch {
        // Continue
      }
    }

    // Method 3: Extract from meta tags (fallback)
    const profileData = extractFromMetaTags(html, username);
    if (profileData) return profileData;

    return null;
  } catch {
    return null;
  }
}

/**
 * Extract profile data from __INITIAL_STATE__ JSON
 */
function extractFromInitialState(data: any, username: string): InstagramProfileData | null {
  try {
    // Navigate the nested structure that Instagram uses
    const user = data?.nativeState?.profile?.user;
    
    if (!user) return null;

    return {
      username: user.username || username,
      displayName: user.full_name || user.name,
      profileImageUrl: user.profile_pic_url || user.profile_picture?.url,
      followers: user.follower_count || user.edge_followed_by?.count,
      following: user.following_count || user.edge_follow?.count,
      postCount: user.post_count || user.edge_owner_to_timeline_media?.count,
    };
  } catch {
    return null;
  }
}

/**
 * Extract profile data from LD+JSON structured data
 */
function extractFromLDJSON(data: any, username: string): InstagramProfileData | null {
  try {
    if (data["@type"] !== "Person" && !data.name) return null;

    return {
      username: data.alternateName || username,
      displayName: data.name,
      profileImageUrl: data.image || data.avatar?.url,
      followers: data.followers?.count,
      following: data.following?.count,
      postCount: data.givenName ? undefined : data.description?.match(/(\d+)\s*posts?/)?.[1] || undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Extract profile data from meta tags (last resort)
 * Uses og: and other meta tags
 */
function extractFromMetaTags(html: string, username: string): InstagramProfileData | null {
  try {
    const profileData: InstagramProfileData = { username };

    // og:title usually contains "user's Photos & Videos on Instagram"
    const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/);
    if (titleMatch) {
      // Extract name from "Name's Photos & Videos on Instagram"
      const name = titleMatch[1].replace(/'s Photos & Videos on Instagram/, "");
      if (name) profileData.displayName = name;
    }

    // og:image contains profile picture
    const imageMatch = html.match(/<meta property="og:image" content="([^"]+)"/);
    if (imageMatch) {
      profileData.profileImageUrl = imageMatch[1];
    }

    // og:description sometimes contains bio with follower info
    const descMatch = html.match(/<meta property="og:description" content="([^"]+)"/);
    if (descMatch) {
      const desc = descMatch[1];
      const followersMatch = desc.match(/(\d+(?:,\d{3})*)\s*followers?/i);
      if (followersMatch) {
        profileData.followers = parseInt(followersMatch[1].replace(/,/g, ""), 10);
      }
    }

    // Check if we got at least some data
    if (Object.keys(profileData).length > 1) {
      return profileData;
    }

    return null;
  } catch {
    return null;
  }
}
