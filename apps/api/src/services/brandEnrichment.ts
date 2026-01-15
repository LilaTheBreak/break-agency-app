/**
 * Brand Enrichment Service
 * 
 * Automatically enriches brand data from publicly available website information.
 * Only uses public data: meta tags, Open Graph, common logo paths.
 * 
 * Legal: Only scrapes publicly accessible HTML, no gated content or personal data.
 */

import { load } from "cheerio";
import { URL } from "url";

export interface EnrichmentResult {
  brandName?: string;
  about?: string;
  industry?: string;
  logoUrl?: string;
  socialLinks?: {
    instagram?: string;
    linkedin?: string;
    tiktok?: string;
    twitter?: string;
    facebook?: string;
  };
  country?: string;
  success: boolean;
  error?: string;
  source: "website" | "manual";
}

/**
 * Normalizes a URL to ensure it's valid and has a protocol
 */
function normalizeUrl(url: string): string {
  if (!url || typeof url !== "string") {
    throw new Error("Invalid URL");
  }
  
  const trimmed = url.trim();
  if (!trimmed) {
    throw new Error("Empty URL");
  }
  
  // Add protocol if missing
  if (!/^https?:\/\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  
  return trimmed;
}

/**
 * Extracts social media links from HTML
 */
function extractSocialLinks($: ReturnType<typeof load>): EnrichmentResult["socialLinks"] {
  const links: EnrichmentResult["socialLinks"] = {};
  
  // Find all links
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href")?.toLowerCase() || "";
    
    // Instagram
    if (href.includes("instagram.com") || href.includes("instagr.am")) {
      const match = href.match(/(?:instagram\.com|instagr\.am)\/([^\/\?]+)/);
      if (match && match[1]) {
        links.instagram = `https://instagram.com/${match[1]}`;
      }
    }
    
    // LinkedIn
    if (href.includes("linkedin.com")) {
      const match = href.match(/linkedin\.com\/(?:company|in)\/([^\/\?]+)/);
      if (match && match[1]) {
        links.linkedin = `https://linkedin.com/company/${match[1]}`;
      }
    }
    
    // TikTok
    if (href.includes("tiktok.com")) {
      const match = href.match(/tiktok\.com\/@?([^\/\?]+)/);
      if (match && match[1]) {
        links.tiktok = `https://tiktok.com/@${match[1]}`;
      }
    }
    
    // Twitter/X
    if (href.includes("twitter.com") || href.includes("x.com")) {
      const match = href.match(/(?:twitter\.com|x\.com)\/([^\/\?]+)/);
      if (match && match[1]) {
        links.twitter = `https://twitter.com/${match[1]}`;
      }
    }
    
    // Facebook
    if (href.includes("facebook.com")) {
      const match = href.match(/facebook\.com\/([^\/\?]+)/);
      if (match && match[1] && !match[1].includes("pages")) {
        links.facebook = `https://facebook.com/${match[1]}`;
      }
    }
  });
  
  return Object.keys(links).length > 0 ? links : undefined;
}

/**
 * Finds logo URL using multiple heuristics
 */
function findLogoUrl($: ReturnType<typeof load>, baseUrl: string): string | undefined {
  const base = new URL(baseUrl);
  
  // Priority 1: Open Graph image
  const ogImage = $('meta[property="og:image"]').attr("content");
  if (ogImage) {
    try {
      const url = new URL(ogImage, baseUrl);
      if (url.protocol === "https:") {
        return url.toString();
      }
    } catch {
      // Invalid URL, continue
    }
  }
  
  // Priority 2: Apple touch icon
  const appleIcon = $('link[rel="apple-touch-icon"]').attr("href");
  if (appleIcon) {
    try {
      const url = new URL(appleIcon, baseUrl);
      if (url.protocol === "https:") {
        return url.toString();
      }
    } catch {
      // Continue
    }
  }
  
  // Priority 3: Favicon
  const favicon = $('link[rel="icon"]').attr("href");
  if (favicon) {
    try {
      const url = new URL(favicon, baseUrl);
      if (url.protocol === "https:") {
        return url.toString();
      }
    } catch {
      // Continue
    }
  }
  
  // Priority 4: Common logo paths
  const commonPaths = [
    "/logo.png",
    "/logo.svg",
    "/logo.jpg",
    "/logo.jpeg",
    "/images/logo.png",
    "/images/logo.svg",
    "/assets/logo.png",
    "/assets/logo.svg",
    "/static/logo.png",
    "/static/logo.svg",
  ];
  
  for (const path of commonPaths) {
    try {
      const url = new URL(path, baseUrl);
      // Note: We don't verify the image exists here - that's handled by the frontend
      return url.toString();
    } catch {
      continue;
    }
  }
  
  // Priority 5: Look for img tags with "logo" in class/id/alt
  const logoImg = $('img[class*="logo"], img[id*="logo"], img[alt*="logo" i]').first();
  const logoSrc = logoImg.attr("src");
  if (logoSrc) {
    try {
      const url = new URL(logoSrc, baseUrl);
      if (url.protocol === "https:") {
        return url.toString();
      }
    } catch {
      // Continue
    }
  }
  
  return undefined;
}

/**
 * Extracts about/description text
 */
function extractAbout($: ReturnType<typeof load>): string | undefined {
  // Try meta description first
  const metaDesc = $('meta[name="description"]').attr("content");
  if (metaDesc && metaDesc.trim().length > 20) {
    return metaDesc.trim();
  }
  
  // Try Open Graph description
  const ogDesc = $('meta[property="og:description"]').attr("content");
  if (ogDesc && ogDesc.trim().length > 20) {
    return ogDesc.trim();
  }
  
  // Try to find an "About" section
  const aboutSection = $('section[id*="about" i], div[id*="about" i], section[class*="about" i], div[class*="about" i]').first();
  if (aboutSection.length > 0) {
    const text = aboutSection.text().trim();
    if (text.length > 20 && text.length < 500) {
      return text;
    }
  }
  
  return undefined;
}

/**
 * Attempts to infer industry from content
 */
function inferIndustry($: ReturnType<typeof load>, brandName: string): string | undefined {
  const text = $("body").text().toLowerCase();
  const name = brandName.toLowerCase();
  
  // Fashion keywords
  if (text.includes("fashion") || text.includes("clothing") || text.includes("apparel") || 
      name.includes("fashion") || name.includes("clothing")) {
    return "Fashion";
  }
  
  // Beauty keywords
  if (text.includes("beauty") || text.includes("cosmetic") || text.includes("skincare") ||
      name.includes("beauty") || name.includes("cosmetic")) {
    return "Beauty";
  }
  
  // Tech keywords
  if (text.includes("technology") || text.includes("software") || text.includes("app") ||
      name.includes("tech") || name.includes("software")) {
    return "Tech";
  }
  
  // Food & Beverage
  if (text.includes("food") || text.includes("restaurant") || text.includes("beverage") ||
      name.includes("food") || name.includes("restaurant")) {
    return "Food & Beverage";
  }
  
  // Travel
  if (text.includes("travel") || text.includes("hotel") || text.includes("tourism") ||
      name.includes("travel") || name.includes("hotel")) {
    return "Travel";
  }
  
  // Hospitality
  if (text.includes("hospitality") || text.includes("hotel") || text.includes("resort")) {
    return "Hospitality";
  }
  
  // Finance
  if (text.includes("finance") || text.includes("banking") || text.includes("investment")) {
    return "Finance";
  }
  
  // Luxury
  if (text.includes("luxury") || text.includes("premium") || text.includes("exclusive")) {
    return "Luxury";
  }
  
  return undefined;
}

/**
 * Main enrichment function
 * Fetches website HTML and extracts brand information
 */
export async function enrichBrandFromUrl(websiteUrl: string, existingBrandName?: string): Promise<EnrichmentResult> {
  try {
    const normalizedUrl = normalizeUrl(websiteUrl);
    const baseUrl = new URL(normalizedUrl);
    
    console.log(`[BRAND ENRICHMENT] Fetching ${normalizedUrl}...`);
    
    // Fetch HTML with timeout and user agent
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.warn(`[BRAND ENRICHMENT] Timeout (>10s) for ${normalizedUrl}`);
      controller.abort();
    }, 10000); // 10 second timeout
    
    try {
      const response = await fetch(normalizedUrl, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; BrandEnrichmentBot/1.0; +https://thebreakco.com)",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "Accept-Encoding": "gzip, deflate",
        },
        redirect: "follow",
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const html = await response.text();
      
      // Parse HTML
      const $ = load(html);
      
      // Extract data
      const brandName = $('meta[property="og:site_name"]').attr("content")?.trim() ||
                       $("title").text().trim() ||
                       existingBrandName;
      
      const about = extractAbout($);
      const logoUrl = findLogoUrl($, normalizedUrl);
      const socialLinks = extractSocialLinks($);
      const industry = inferIndustry($, brandName || "");
      
      // Extract country from domain or content (best-effort)
      let country: string | undefined;
      const tld = baseUrl.hostname.split(".").pop()?.toLowerCase();
      if (tld && tld.length === 2) {
        // Could be a country code TLD, but we won't assume
        // This is best-effort only
      }
      
      console.log(`[BRAND ENRICHMENT] Successfully enriched ${normalizedUrl}`);
      
      return {
        brandName,
        about,
        industry,
        logoUrl,
        socialLinks,
        country,
        success: true,
        source: "website",
      };
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[BRAND ENRICHMENT] Failed to enrich ${websiteUrl}:`, errorMessage);
    
    return {
      success: false,
      error: errorMessage,
      source: "website",
    };
  }
}

