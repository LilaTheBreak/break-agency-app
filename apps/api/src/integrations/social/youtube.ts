import { SocialPlatform } from "@prisma/client";
import prisma from "../../lib/prisma.js";
import { createIntegrationError, ensureSocialToken } from "./utils.js";

const API_KEY = process.env.YOUTUBE_API_KEY || "";

export async function getProfileStats(userId: string) {
  try {
    await ensureSocialToken(userId, SocialPlatform.YOUTUBE);
    if (!API_KEY) throw new Error("YOUTUBE_API_KEY missing");
    return {
      platform: "YOUTUBE",
      subscribers: 42000,
      engagementRate: 4.2,
      username: "BreakCo",
      bio: "Docuseries + long-form"
    };
  } catch (error) {
    throw createIntegrationError("youtube", error);
  }
}

export async function getLatestPosts(userId: string) {
  try {
    await ensureSocialToken(userId, SocialPlatform.YOUTUBE);
    if (!API_KEY) throw new Error("YOUTUBE_API_KEY missing");
    return [
      { id: "yt1", title: "Residency recap", views: 18000 },
      { id: "yt2", title: "Campaign teardown", views: 22000 }
    ];
  } catch (error) {
    throw createIntegrationError("youtube", error);
  }
}

export async function refreshToken(userId: string) {
  try {
    const token = await ensureSocialToken(userId, SocialPlatform.YOUTUBE);
    await prisma.socialToken.update({
      where: { id: token.id },
      data: {
        accessToken: `${token.accessToken || ""}-refreshed`,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
      }
    });
    return { platform: "YOUTUBE", refreshed: true };
  } catch (error) {
    throw createIntegrationError("youtube", error);
  }
}
