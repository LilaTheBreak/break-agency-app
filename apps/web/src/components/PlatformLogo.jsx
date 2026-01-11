/**
 * Platform Logo Component
 * 
 * Uses image-based logos for social platforms
 * Provides consistent sizing and fallback to SVG icons
 */

import React from "react";

const LOGO_MAP = {
  INSTAGRAM: "/logos/instagram.jpeg",
  TIKTOK: "/logos/tiktok.avif",
  YOUTUBE: "/logos/youtube.webp",
  FACEBOOK: "/logos/facebook.avif",
  LINKEDIN: "/logos/linkedin.png",
  SHOPIFY: "/logos/shopify.png",
  SUBSTACK: "/logos/substack.png",
};

const FALLBACK_COLORS = {
  INSTAGRAM: "bg-[#E4405F]",
  TIKTOK: "bg-[#000000]",
  YOUTUBE: "bg-[#FF0000]",
  FACEBOOK: "bg-[#1877F2]",
  LINKEDIN: "bg-[#0A66C2]",
  SHOPIFY: "bg-[#96bf48]",
  SUBSTACK: "bg-[#FF6B6B]",
};

const FALLBACK_ICONS = {
  INSTAGRAM: "📷",
  TIKTOK: "🎵",
  YOUTUBE: "▶️",
  FACEBOOK: "f",
  LINKEDIN: "in",
  SHOPIFY: "S",
  SUBSTACK: "📮",
};

/**
 * PlatformLogo Component
 * @param {string} platform - Platform name (INSTAGRAM, TIKTOK, etc.)
 * @param {string} size - Size class (sm, md, lg)
 * @param {boolean} showLabel - Show platform label
 */
export function PlatformLogo({ platform, size = "md", showLabel = false }) {
  const logoUrl = LOGO_MAP[platform];
  const fallbackColor = FALLBACK_COLORS[platform];
  const fallbackIcon = FALLBACK_ICONS[platform];

  const sizeClass = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  }[size] || "h-8 w-8";

  const labelSize = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  }[size] || "text-sm";

  const platformLabel = {
    INSTAGRAM: "Instagram",
    TIKTOK: "TikTok",
    YOUTUBE: "YouTube",
    FACEBOOK: "Facebook",
    LINKEDIN: "LinkedIn",
    SHOPIFY: "Shopify",
    SUBSTACK: "Substack",
  }[platform] || platform;

  if (!logoUrl) {
    // Fallback to emoji/initials if logo not found
    return (
      <div className="flex items-center gap-2">
        <div className={`${sizeClass} flex items-center justify-center rounded-full ${fallbackColor} text-white font-semibold text-[10px]`}>
          {fallbackIcon}
        </div>
        {showLabel && <span className={labelSize}>{platformLabel}</span>}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <img
        src={logoUrl}
        alt={`${platformLabel} logo`}
        className={`${sizeClass} object-contain rounded-full bg-white p-1`}
        onError={(e) => {
          // Fallback if image fails to load
          e.target.style.display = "none";
          e.target.nextElementSibling?.style.display = "flex";
        }}
      />
      {/* Fallback emoji if image fails */}
      <div
        className={`${sizeClass} hidden items-center justify-center rounded-full ${fallbackColor} text-white font-semibold text-[10px]`}
      >
        {fallbackIcon}
      </div>
      {showLabel && <span className={labelSize}>{platformLabel}</span>}
    </div>
  );
}

export default PlatformLogo;
