/**
 * Instagram URL Normalization Utility
 * 
 * Handles both full URLs and usernames
 * Validates format
 * Returns normalized URL and username
 */

export interface NormalizedInstagramHandle {
  username: string;
  url: string;
  isValid: boolean;
  error?: string;
}

/**
 * Normalize Instagram input (URL or username)
 * Accepts:
 * - https://instagram.com/username
 * - https://www.instagram.com/username
 * - instagram.com/username
 * - @username
 * - username
 */
export function normalizeInstagramHandle(input: string): NormalizedInstagramHandle {
  if (!input || typeof input !== "string") {
    return {
      username: "",
      url: "",
      isValid: false,
      error: "Input is required",
    };
  }

  const trimmed = input.trim();

  try {
    // Try to parse as URL first
    let username: string | null = null;

    // Check if it looks like a URL
    if (trimmed.includes("instagram.com") || trimmed.startsWith("http")) {
      try {
        const url = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
        const pathname = url.pathname;
        
        // Extract username from path
        const match = pathname.match(/^\/([a-zA-Z0-9_.]+)\/?$/);
        if (match && match[1]) {
          username = match[1].toLowerCase();
        }
      } catch {
        // Not a valid URL
      }
    }

    // If not a URL, treat as username
    if (!username) {
      username = trimmed.replace(/^@/, "").toLowerCase();
    }

    // Validate username format
    // Instagram usernames: 1-30 chars, letters numbers dots underscores, can't end with dot
    if (!/^[a-z0-9_.]{1,30}$/.test(username) || username.endsWith(".")) {
      return {
        username,
        url: "",
        isValid: false,
        error: "Invalid Instagram username format",
      };
    }

    // Return normalized version
    return {
      username,
      url: `https://www.instagram.com/${username}/`,
      isValid: true,
    };
  } catch (error) {
    return {
      username: "",
      url: "",
      isValid: false,
      error: error instanceof Error ? error.message : "Invalid input",
    };
  }
}
