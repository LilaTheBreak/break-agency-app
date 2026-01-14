import axios from "axios";
import type { SocialPlatform } from '../types/socialPlatform.js';

type TokenResponse = {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  metadata?: Record<string, unknown>;
};

type SocialProfile = {
  platformUserId: string;
  username: string;
  displayName?: string;
  profileUrl?: string;
  profileImage?: string;
  bio?: string;
  followers?: number;
  following?: number;
  metrics?: Record<string, unknown>;
};

type SocialPost = {
  platformPostId: string;
  caption?: string;
  mediaUrl?: string;
  thumbnailUrl?: string;
  postedAt?: Date;
  likes?: number;
  comments?: number;
  shares?: number;
  views?: number;
  engagementRate?: number;
  metadata?: Record<string, unknown>;
};

export async function exchangeCodeForToken(
  platform: SocialPlatform,
  code: string,
  redirectUri: string
): Promise<TokenResponse> {
  switch (platform) {
    case "INSTAGRAM":
    case "FACEBOOK":
      return mockTokenResponse(platform, code);
    case "TIKTOK":
    case "YOUTUBE":
    case "X":
      return mockTokenResponse(platform, code);
    default:
      throw new Error(`Unsupported platform ${platform}`);
  }
}

export async function fetchSocialProfile(
  platform: SocialPlatform,
  accessToken: string
): Promise<SocialProfile> {
  try {
    switch (platform) {
      case "INSTAGRAM":
        return {
          platformUserId: "ig_123",
          username: "thebreakco",
          displayName: "Break Co",
          profileUrl: "https://instagram.com/thebreakco",
          profileImage: "https://images.thebreakco.com/ig-avatar.png",
          bio: "Modern talent partnerships.",
          followers: 180000,
          following: 120,
          metrics: {}
        };
      case "TIKTOK":
        return {
          platformUserId: "tt_123",
          username: "breakco",
          displayName: "Break Co",
          profileUrl: "https://www.tiktok.com/@breakco",
          profileImage: "https://images.thebreakco.com/tiktok-avatar.png",
          followers: 230000,
          following: 45,
          metrics: {}
        };
      case "YOUTUBE":
        return {
          platformUserId: "yt_123",
          username: "BreakCo",
          displayName: "Break Co",
          profileUrl: "https://youtube.com/@breakco",
          profileImage: "https://images.thebreakco.com/youtube-avatar.png",
          followers: 42000,
          following: 0,
          metrics: {}
        };
      case "X":
        return {
          platformUserId: "x_123",
          username: "BreakConsole",
          displayName: "Break Co Console",
          profileUrl: "https://x.com/breakconsole",
          profileImage: "https://images.thebreakco.com/x-avatar.png",
          followers: 56000,
          following: 310,
          metrics: {}
        };
      default:
        throw new Error(`Unsupported platform ${platform}`);
    }
  } catch (error) {
    console.error("fetchSocialProfile error", error);
    throw error;
  }
}

export async function fetchSocialPosts(
  platform: SocialPlatform,
  accessToken: string
): Promise<SocialPost[]> {
  void accessToken;
  const now = Date.now();
  return Array.from({ length: 5 }).map((_, index) => ({
    platformPostId: `${platform.toLowerCase()}_${index}`,
    caption: `Sample ${platform} post #${index + 1}`,
    mediaUrl: "https://images.thebreakco.com/sample-post.jpg",
    thumbnailUrl: "https://images.thebreakco.com/sample-thumb.jpg",
    postedAt: new Date(now - index * 1000 * 60 * 60 * 24),
    likes: 1000 - index * 57,
    comments: 140 - index * 12,
    shares: 80 - index * 5,
    views: 12000 - index * 750,
    engagementRate: 4.2 - index * 0.2,
    metadata: { platform }
  }));
}

export async function fetchAnalyticsSnapshot(
  platform: SocialPlatform,
  accessToken: string
): Promise<{
  followerCount: number;
  engagementRate?: number;
  velocityScore?: number;
  reach?: number;
  profileViews?: number;
  demographics?: Record<string, unknown>;
}> {
  void accessToken;
  switch (platform) {
    case "INSTAGRAM":
      return {
        followerCount: 180000,
        engagementRate: 5.2,
        velocityScore: 1.6,
        reach: 4100000,
        demographics: { primary: "US · 25-34", genderSplit: "71% women" }
      };
    case "TIKTOK":
      return {
        followerCount: 230000,
        engagementRate: 6.8,
        velocityScore: 1.9,
        reach: 5200000
      };
    case "YOUTUBE":
      return {
        followerCount: 42000,
        engagementRate: 4.2,
        velocityScore: 1.3,
        profileViews: 36000
      };
    case "X":
      return {
        followerCount: 56000,
        engagementRate: 3.1,
        velocityScore: 1.1,
        reach: 720000
      };
    default:
      throw new Error(`Unsupported platform ${platform}`);
  }
}

function mockTokenResponse(platform: SocialPlatform, code: string): TokenResponse {
  void code;
  return {
    accessToken: `access_${platform.toLowerCase()}_${Date.now()}`,
    refreshToken: `refresh_${platform.toLowerCase()}_${Date.now()}`,
    expiresIn: 3600,
    metadata: {}
  };
}
