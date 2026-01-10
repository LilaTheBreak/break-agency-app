import prisma from "../lib/prisma.js";
import type { SocialAccountConnection, Talent } from "@prisma/client";

interface SocialIntelligenceData {
  connected: boolean;
  platforms: string[];
  overview: {
    totalReach: number;
    engagementRate: number;
    followerGrowth: number;
    postCount: number;
    avgPostsPerWeek: number;
    topPlatform: string;
    topPlatformFollowers: number;
    sentimentScore: number;
  } | null;
  contentPerformance: Array<{
    id: string;
    platform: string;
    caption: string;
    format: string;
    likes: number;
    comments: number;
    saves?: number;
    engagementRate: number;
    tags?: string[];
  }>;
  keywords: Array<{
    id?: string;
    term: string;
    frequency: number;
    category: "core" | "emerging" | "declining";
  }>;
  community: {
    commentVolume: number;
    commentTrend: number;
    responseRate: number;
    responseTrend: number;
    averageSentiment: number;
    consistencyScore: number;
    alerts?: Array<{
      message: string;
      context?: string;
    }>;
  } | null;
  paidContent: Array<{
    id: string;
    name: string;
    platform: string;
    postType: string;
    reach: number;
    engagements: number;
    costPerEngagement?: number;
    performance: "Strong" | "Average" | "Underperforming";
  }>;
  notes: string;
}

/**
 * SocialIntelligenceService
 * 
 * Aggregates social media data into strategic intelligence
 * Transforms raw social stats into business insights
 */
export async function getTalentSocialIntelligence(talentId: string): Promise<SocialIntelligenceData> {
  try {
    // Fetch talent and social accounts
    const talent = await prisma.talent.findUnique({
      where: { id: talentId },
      include: {
        SocialAccountConnection: {
          where: { connected: true },
        },
      },
    });

    if (!talent || !talent.SocialAccountConnection.length) {
      return {
        connected: false,
        platforms: [],
        overview: null,
        contentPerformance: [],
        keywords: [],
        community: null,
        paidContent: [],
        notes: "",
      };
    }

    // Get connected platforms
    const platforms = talent.SocialAccountConnection.map((acc) => acc.platform);

    // For MVP: Return sample data structure with calculated metrics
    // In production, this would fetch from social APIs or cached analytics DB
    const sampleIntelligence = generateSampleIntelligence(talent, platforms);

    // Fetch any saved notes
    const notes = await getSavedNotes(talentId);

    return {
      connected: true,
      platforms,
      overview: sampleIntelligence.overview,
      contentPerformance: sampleIntelligence.contentPerformance,
      keywords: sampleIntelligence.keywords,
      community: sampleIntelligence.community,
      paidContent: sampleIntelligence.paidContent,
      notes: notes || "",
    };
  } catch (error) {
    console.error("[SOCIAL_INTELLIGENCE] Error:", error);
    throw error;
  }
}

/**
 * Generate sample intelligence data for MVP
 * In production, this would aggregate real API data
 */
function generateSampleIntelligence(talent: any, platforms: string[]) {
  const randomBetween = (min: number, max: number) => Math.random() * (max - min) + min;

  return {
    overview: {
      totalReach: Math.floor(randomBetween(50000, 500000)),
      engagementRate: parseFloat(randomBetween(1.5, 6.5).toFixed(2)),
      followerGrowth: Math.floor(randomBetween(-100, 5000)),
      postCount: Math.floor(randomBetween(15, 45)),
      avgPostsPerWeek: parseFloat(randomBetween(2, 7).toFixed(1)),
      topPlatform: platforms[0] || "Instagram",
      topPlatformFollowers: Math.floor(randomBetween(50000, 500000)),
      sentimentScore: parseFloat(randomBetween(0.65, 0.95).toFixed(2)),
    },
    contentPerformance: [
      {
        id: "post-1",
        platform: platforms[0] || "Instagram",
        caption: "Behind-the-scenes content from latest collaboration",
        format: "video",
        likes: Math.floor(randomBetween(5000, 50000)),
        comments: Math.floor(randomBetween(200, 2000)),
        saves: Math.floor(randomBetween(100, 1000)),
        engagementRate: parseFloat(randomBetween(3.5, 8).toFixed(2)),
        tags: ["Brand-friendly", "High-conversion"],
      },
      {
        id: "post-2",
        platform: platforms[0] || "Instagram",
        caption: "Product integration that resonated with community",
        format: "carousel",
        likes: Math.floor(randomBetween(8000, 45000)),
        comments: Math.floor(randomBetween(300, 1500)),
        saves: Math.floor(randomBetween(200, 800)),
        engagementRate: parseFloat(randomBetween(2.8, 7).toFixed(2)),
        tags: ["Community-led", "High-conversion"],
      },
      {
        id: "post-3",
        platform: platforms[1] || "TikTok",
        caption: "Trending audio with authentic take",
        format: "reels",
        likes: Math.floor(randomBetween(50000, 500000)),
        comments: Math.floor(randomBetween(1000, 8000)),
        saves: Math.floor(randomBetween(500, 5000)),
        engagementRate: parseFloat(randomBetween(4.2, 9.5).toFixed(2)),
        tags: ["Viral-moment", "Creative-risk"],
      },
      {
        id: "post-4",
        platform: platforms[0] || "Instagram",
        caption: "Lifestyle content aligned with personal brand",
        format: "photo",
        likes: Math.floor(randomBetween(3000, 15000)),
        comments: Math.floor(randomBetween(100, 800)),
        saves: Math.floor(randomBetween(50, 300)),
        engagementRate: parseFloat(randomBetween(1.2, 3.5).toFixed(2)),
        tags: ["Brand-friendly"],
      },
      {
        id: "post-5",
        platform: platforms[2] || "YouTube",
        caption: "Long-form collaboration with premium brand",
        format: "video",
        likes: Math.floor(randomBetween(10000, 100000)),
        comments: Math.floor(randomBetween(500, 5000)),
        saves: Math.floor(randomBetween(200, 2000)),
        engagementRate: parseFloat(randomBetween(2.5, 6.5).toFixed(2)),
        tags: ["Brand-pitch", "High-conversion"],
      },
      {
        id: "post-6",
        platform: platforms[0] || "Instagram",
        caption: "Q&A with community - strong sentiment",
        format: "story",
        likes: Math.floor(randomBetween(2000, 10000)),
        comments: Math.floor(randomBetween(150, 1000)),
        saves: 0,
        engagementRate: parseFloat(randomBetween(3.2, 7.8).toFixed(2)),
        tags: ["Community-led"],
      },
      {
        id: "post-7",
        platform: platforms[0] || "Instagram",
        caption: "Educational content on niche topic",
        format: "carousel",
        likes: Math.floor(randomBetween(4000, 20000)),
        comments: Math.floor(randomBetween(250, 1500)),
        saves: Math.floor(randomBetween(300, 1200)),
        engagementRate: parseFloat(randomBetween(2.8, 5.5).toFixed(2)),
        tags: ["Community-led"],
      },
      {
        id: "post-8",
        platform: platforms[1] || "TikTok",
        caption: "Trend-jacking with personal twist",
        format: "reels",
        likes: Math.floor(randomBetween(30000, 300000)),
        comments: Math.floor(randomBetween(800, 5000)),
        saves: Math.floor(randomBetween(400, 3000)),
        engagementRate: parseFloat(randomBetween(3.8, 8.2).toFixed(2)),
        tags: ["Creative-risk"],
      },
    ],
    keywords: [
      { term: "lifestyle", frequency: 487, category: "core" as const },
      { term: "fashion", frequency: 456, category: "core" as const },
      { term: "confidence", frequency: 342, category: "core" as const },
      { term: "beauty", frequency: 289, category: "core" as const },
      { term: "motivation", frequency: 267, category: "core" as const },
      { term: "wellness", frequency: 198, category: "emerging" as const },
      { term: "sustainability", frequency: 156, category: "emerging" as const },
      { term: "mental health", frequency: 142, category: "emerging" as const },
      { term: "tech", frequency: 89, category: "declining" as const },
      { term: "politics", frequency: 34, category: "declining" as const },
    ],
    community: {
      commentVolume: Math.floor(randomBetween(5000, 30000)),
      commentTrend: parseFloat(randomBetween(-15, 25).toFixed(1)),
      responseRate: parseFloat(randomBetween(0.4, 0.85).toFixed(2)),
      responseTrend: parseFloat(randomBetween(-10, 20).toFixed(1)),
      averageSentiment: parseFloat(randomBetween(0.68, 0.92).toFixed(2)),
      consistencyScore: parseFloat(randomBetween(0.6, 0.95).toFixed(2)),
      alerts: [
        {
          message: "Negative sentiment spike detected on recent post",
          context: "3-4% negative comments (normal 1-2%)",
        },
        {
          message: "Increased DM volume",
          context: "50+ new partnership inquiries this week",
        },
      ],
    },
    paidContent: [
      {
        id: "paid-1",
        name: "Q1 Product Campaign",
        platform: "Instagram",
        postType: "boosted",
        reach: Math.floor(randomBetween(100000, 500000)),
        engagements: Math.floor(randomBetween(8000, 40000)),
        costPerEngagement: parseFloat((randomBetween(0.05, 0.15)).toFixed(2)),
        performance: "Strong" as const,
      },
      {
        id: "paid-2",
        name: "TikTok Brand Partnership",
        platform: "TikTok",
        postType: "branded",
        reach: Math.floor(randomBetween(500000, 2000000)),
        engagements: Math.floor(randomBetween(50000, 200000)),
        costPerEngagement: parseFloat((randomBetween(0.02, 0.08)).toFixed(2)),
        performance: "Strong" as const,
      },
      {
        id: "paid-3",
        name: "Holiday Promo Campaign",
        platform: "Instagram",
        postType: "ad",
        reach: Math.floor(randomBetween(80000, 300000)),
        engagements: Math.floor(randomBetween(4000, 15000)),
        costPerEngagement: parseFloat((randomBetween(0.08, 0.18)).toFixed(2)),
        performance: "Average" as const,
      },
    ],
  };
}

/**
 * Save agent notes for talent social intelligence
 */
export async function saveSocialIntelligenceNotes(
  talentId: string,
  notes: string
): Promise<void> {
  try {
    await prisma.talent.update({
      where: { id: talentId },
      data: {
        socialIntelligenceNotes: notes,
      },
    });
  } catch (error) {
    console.error("[SOCIAL_INTELLIGENCE] Error saving notes:", error);
    throw error;
  }
}

/**
 * Retrieve saved notes
 */
async function getSavedNotes(talentId: string): Promise<string> {
  try {
    const talent = await prisma.talent.findUnique({
      where: { id: talentId },
      select: {
        socialIntelligenceNotes: true,
      },
    });
    return talent?.socialIntelligenceNotes || "";
  } catch (error) {
    console.error("[SOCIAL_INTELLIGENCE] Error retrieving notes:", error);
    return "";
  }
}
