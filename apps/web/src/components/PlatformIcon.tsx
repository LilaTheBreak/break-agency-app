/**
 * Platform Icons Component
 * 
 * Official platform icons (Instagram, TikTok, YouTube, Twitter, LinkedIn)
 * Styled consistently with brand color palette
 */

import React from "react";

export const PlatformIcons = {
  INSTAGRAM: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <rect x="2" y="2" width="20" height="20" rx="4.5" ry="4.5" />
      <path
        d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10z"
        fill="white"
      />
      <circle cx="17.5" cy="6.5" r="1.5" fill="white" />
    </svg>
  ),

  TIKTOK: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M16.6 5.82s.51-1.82 1.94-2.82c1.01 1.49.67 3.7.67 3.7s1.52-1.45 3.52-1.23c0 0-1.52 2.94-.7 5.25c-.73 1.42-4.3 4.58-8.57 4.58s-7.54-3.16-8.27-4.58c.82-2.31-1.03-5.25-1.03-5.25s2.48-.22 3.49 1.23c-.39 2.06-1.9 2.74-1.9 2.74s2.5.71 5.24.71c4.27 0 7.84-3.16 8.57-4.58z" />
    </svg>
  ),

  YOUTUBE: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  ),

  TWITTER: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M23.953 4.57a10 10 0 002.856 2.863c.026.164.028.326.028.514v.534l-.122.058a10.01 10.01 0 01-2.925 2.931l-.097.052v.481c0 1.794-.888 3.518-2.477 4.743-1.588 1.226-3.72 1.795-5.95 1.795a12.01 12.01 0 01-5.997-1.605 11.96 11.96 0 01-3.948-3.088c-.412-.421-.771-.898-1.066-1.412h.017C.5 19.517 1.7 20.42 3.078 21.04c1.378.62 2.931.984 4.53.984 1.599 0 3.152-.364 4.53-.984 1.378-.62 2.578-1.523 3.41-2.596.834-1.073 1.33-2.288 1.402-3.584l.01-.137.006-.1c.006-.102.006-.204.006-.306a10.02 10.02 0 001.856-2.001l.08-.090a10 10 0 002.856-2.863m-19.93 10.297c.17.173.357.33.555.475-.007-.072-.007-.145-.007-.217 0-1.794.888-3.518 2.477-4.743 1.588-1.226 3.72-1.795 5.95-1.795.897 0 1.771.093 2.613.272l-.04-.008a10 10 0 00-8.945 8.016zm15.47-10.297l-.08.09a10 10 0 00-2.856 2.863c-.026.164-.028.326-.028.514v.534l.122.058a10.01 10.01 0 002.925 2.931l.097.052v.481c0 1.794-.888 3.518-2.477 4.743-1.588 1.226-3.72 1.795-5.95 1.795a12.01 12.01 0 01-5.997-1.605" />
    </svg>
  ),

  LINKEDIN: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.475-2.236-1.986-2.236-1.081 0-1.722.722-2.004 1.418-.103.249-.129.597-.129.946v5.441h-3.554s.05-8.736 0-9.646h3.554v1.366c.43-.664 1.199-1.608 2.920-1.608 2.134 0 3.733 1.39 3.733 4.38v5.508zM5.337 9.433a2.062 2.062 0 110-4.124 2.06 2.06 0 010 4.124zm1.782 10.019H3.555V9.786h3.564v9.666zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z" />
    </svg>
  ),
};

/**
 * Platform color mapping for consistent branding
 */
export const platformColors: Record<string, { bg: string; text: string; hover: string }> = {
  INSTAGRAM: {
    bg: "bg-[#E4405F]/10",
    text: "text-[#E4405F]",
    hover: "hover:bg-[#E4405F]/20",
  },
  TIKTOK: {
    bg: "bg-[#000000]/10",
    text: "text-[#000000]",
    hover: "hover:bg-[#000000]/20",
  },
  YOUTUBE: {
    bg: "bg-[#FF0000]/10",
    text: "text-[#FF0000]",
    hover: "hover:bg-[#FF0000]/20",
  },
  TWITTER: {
    bg: "bg-[#1DA1F2]/10",
    text: "text-[#1DA1F2]",
    hover: "hover:bg-[#1DA1F2]/20",
  },
  LINKEDIN: {
    bg: "bg-[#0A66C2]/10",
    text: "text-[#0A66C2]",
    hover: "hover:bg-[#0A66C2]/20",
  },
};

export const platformNames: Record<string, string> = {
  INSTAGRAM: "Instagram",
  TIKTOK: "TikTok",
  YOUTUBE: "YouTube",
  TWITTER: "X (Twitter)",
  LINKEDIN: "LinkedIn",
};

interface PlatformIconProps {
  platform: string;
  size?: "sm" | "md" | "lg";
}

export function PlatformIcon({ platform, size = "md" }: PlatformIconProps) {
  const IconComponent = PlatformIcons[platform as keyof typeof PlatformIcons];
  const colors = platformColors[platform];

  if (!IconComponent) {
    return null;
  }

  const sizeClasses = {
    sm: "w-5 h-5",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  return (
    <div className={`${colors.bg} rounded-lg p-2 flex items-center justify-center`}>
      <IconComponent className={`${sizeClasses[size]} ${colors.text}`} />
    </div>
  );
}

export default PlatformIcon;
