/**
 * Canonical Frontend URL Configuration
 * 
 * This ensures OAuth redirects always go to the correct production domain,
 * never to Vercel preview URLs or incorrect domains.
 * 
 * Priority:
 * 1. FRONTEND_URL (explicit production URL)
 * 2. Production domain check (if NODE_ENV=production)
 * 3. WEB_APP_URL (fallback)
 * 4. FRONTEND_ORIGIN (only if not a preview URL)
 * 5. Localhost (development only)
 */

const PRODUCTION_DOMAIN = "https://www.tbctbctbc.online";

/**
 * Get the canonical frontend URL for OAuth redirects
 * In production, this MUST be the production domain, never a preview URL
 */
export function getCanonicalFrontendUrl(): string {
  // Explicit FRONTEND_URL takes highest priority
  if (process.env.FRONTEND_URL) {
    const url = process.env.FRONTEND_URL.trim();
    // In production, validate it's not a preview URL
    if (process.env.NODE_ENV === "production" && url.includes(".vercel.app")) {
      console.warn(
        `[FRONTEND_URL] WARNING: FRONTEND_URL is set to preview URL "${url}" in production. ` +
        `Using production domain "${PRODUCTION_DOMAIN}" instead.`
      );
      return PRODUCTION_DOMAIN;
    }
    return url;
  }

  // In production, always use production domain
  if (process.env.NODE_ENV === "production") {
    return PRODUCTION_DOMAIN;
  }

  // Check WEB_APP_URL (should be production domain)
  if (process.env.WEB_APP_URL) {
    const url = process.env.WEB_APP_URL.trim();
    // In production, reject preview URLs
    if (process.env.NODE_ENV === "production" && url.includes(".vercel.app")) {
      console.warn(
        `[WEB_APP_URL] WARNING: WEB_APP_URL is set to preview URL "${url}" in production. ` +
        `Using production domain "${PRODUCTION_DOMAIN}" instead.`
      );
      return PRODUCTION_DOMAIN;
    }
    // Use first URL if comma-separated
    return url.split(',')[0].trim();
  }

  // Check FRONTEND_ORIGIN (may contain preview URLs, so filter them out in production)
  if (process.env.FRONTEND_ORIGIN) {
    const origins = process.env.FRONTEND_ORIGIN.split(',').map(o => o.trim());
    
    if (process.env.NODE_ENV === "production") {
      // In production, filter out preview URLs and use production domain
      const nonPreviewOrigins = origins.filter(origin => 
        !origin.includes(".vercel.app") && 
        origin.includes("tbctbctbc.online")
      );
      
      if (nonPreviewOrigins.length > 0) {
        return nonPreviewOrigins[0];
      }
      
      // If no valid production origin found, use canonical production domain
      console.warn(
        `[FRONTEND_ORIGIN] WARNING: No valid production domain found in FRONTEND_ORIGIN. ` +
        `Using production domain "${PRODUCTION_DOMAIN}" instead.`
      );
      return PRODUCTION_DOMAIN;
    }
    
    // In non-production, use first origin (allows preview URLs)
    return origins[0];
  }

  // Development fallback
  if (process.env.NODE_ENV === "production") {
    // In production, must have explicit config
    throw new Error('WEB_URL environment variable is required in production. Cannot determine canonical frontend URL.');
  }
  return "http://localhost:5173";
}

/**
 * Get the canonical frontend URL (cached)
 */
let cachedFrontendUrl: string | null = null;

export function getFrontendUrl(): string {
  if (!cachedFrontendUrl) {
    cachedFrontendUrl = getCanonicalFrontendUrl();
    console.log(`[FRONTEND_URL] Canonical frontend URL: ${cachedFrontendUrl}`);
  }
  return cachedFrontendUrl;
}

