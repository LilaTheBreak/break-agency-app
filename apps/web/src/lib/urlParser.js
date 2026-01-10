/**
 * Social Media URL Parser
 * 
 * Extracts platform and handle from URLs for Instagram, TikTok, YouTube
 * Supports various URL formats and variations
 */

export const PLATFORMS = {
  INSTAGRAM: "INSTAGRAM",
  TIKTOK: "TIKTOK",
  YOUTUBE: "YOUTUBE",
};

/**
 * Parse a social media URL to extract platform and handle
 * 
 * @param {string} url - The URL to parse
 * @returns {Object|null} - { platform: string, handle: string } or null if invalid
 * 
 * @example
 * parseProfileUrl("https://instagram.com/username") 
 * // => { platform: "INSTAGRAM", handle: "username" }
 * 
 * parseProfileUrl("https://tiktok.com/@username")
 * // => { platform: "TIKTOK", handle: "username" }
 * 
 * parseProfileUrl("https://youtube.com/@channelname")
 * // => { platform: "YOUTUBE", handle: "channelname" }
 */
export function parseProfileUrl(url) {
  if (!url || typeof url !== "string") {
    return null;
  }

  // Normalize URL
  let normalizedUrl = url.trim().toLowerCase();
  
  // Add https:// if missing
  if (!normalizedUrl.startsWith("http://") && !normalizedUrl.startsWith("https://")) {
    normalizedUrl = "https://" + normalizedUrl;
  }

  try {
    const urlObj = new URL(normalizedUrl);
    const hostname = urlObj.hostname.replace("www.", "");
    const pathname = urlObj.pathname;

    // ===== INSTAGRAM =====
    if (hostname.includes("instagram.com")) {
      // Formats:
      // https://instagram.com/username
      // https://www.instagram.com/username
      // @username
      
      let handle = pathname.replace(/^\//, "").replace(/\/$/, "");
      
      // Remove common Instagram paths
      if (handle.includes("/")) {
        handle = handle.split("/")[0];
      }
      
      // Clean up handle
      handle = handle.replace(/[^\w.-]/g, "").trim();
      
      if (handle) {
        return {
          platform: PLATFORMS.INSTAGRAM,
          handle: handle,
        };
      }
    }

    // ===== TIKTOK =====
    if (hostname.includes("tiktok.com")) {
      // Formats:
      // https://tiktok.com/@username
      // https://www.tiktok.com/@username
      // https://vm.tiktok.com/... (short links - need special handling)
      
      let handle = pathname.replace(/^\//, "").replace(/\/$/, "");
      
      // If it's a VM link (video), return null - can't extract handle
      if (handle.includes("vm") || handle.includes("v")) {
        return null;
      }
      
      // Remove @ if present
      handle = handle.replace(/^@/, "");
      
      // Remove common TikTok paths
      if (handle.includes("/")) {
        handle = handle.split("/")[0];
      }
      
      // Clean up handle
      handle = handle.replace(/[^\w.-]/g, "").trim();
      
      if (handle) {
        return {
          platform: PLATFORMS.TIKTOK,
          handle: handle,
        };
      }
    }

    // ===== YOUTUBE =====
    if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) {
      // Formats:
      // https://youtube.com/@channelname
      // https://youtube.com/c/channelname
      // https://youtube.com/user/username
      // https://youtu.be/... (short video links - not useful for profile)
      
      // Short links (youtu.be) are video IDs, not profiles
      if (hostname.includes("youtu.be")) {
        return null;
      }

      let handle = pathname.replace(/^\//, "").replace(/\/$/, "");
      
      // Extract from @channel format
      if (handle.startsWith("@")) {
        handle = handle.substring(1);
      } 
      // Extract from /c/ or /user/ format
      else if (handle.includes("/")) {
        handle = handle.split("/")[1];
      }
      
      // Clean up handle
      handle = handle.replace(/[^\w.-]/g, "").trim();
      
      if (handle) {
        return {
          platform: PLATFORMS.YOUTUBE,
          handle: handle,
        };
      }
    }

    return null;
  } catch (err) {
    console.error("Error parsing URL:", err);
    return null;
  }
}

/**
 * Validate a parsed profile
 */
export function validateProfile(profile) {
  if (!profile) return false;
  if (!profile.platform || !PLATFORMS[profile.platform]) return false;
  if (!profile.handle || profile.handle.length < 1) return false;
  if (profile.handle.length > 255) return false;
  
  return true;
}

/**
 * Format handle for display
 */
export function formatHandle(handle) {
  if (!handle) return "";
  
  // Remove @ if present
  const clean = handle.startsWith("@") ? handle.substring(1) : handle;
  
  // Return with @ for display
  return `@${clean}`;
}

/**
 * Get platform display name
 */
export function getPlatformName(platform) {
  const names = {
    [PLATFORMS.INSTAGRAM]: "Instagram",
    [PLATFORMS.TIKTOK]: "TikTok",
    [PLATFORMS.YOUTUBE]: "YouTube",
  };
  
  return names[platform] || platform;
}

/**
 * Get platform icon or color
 */
export function getPlatformColor(platform) {
  const colors = {
    [PLATFORMS.INSTAGRAM]: "#E4405F", // Instagram gradient start
    [PLATFORMS.TIKTOK]: "#000000",    // TikTok black
    [PLATFORMS.YOUTUBE]: "#FF0000",   // YouTube red
  };
  
  return colors[platform] || "#000";
}
