import { SocialPlatform } from "@prisma/client";
import prisma from "../../lib/prisma.js";
import { createIntegrationError, ensureSocialToken } from "./utils.js";

const API_KEY = process.env.INSTAGRAM_API_KEY || "";

async function simulateApiCall(tokenId: string) {
  void tokenId;
  return {
    followers: 180000,
    engagementRate: 5.1,
    username: "thebreakco",
    bio: "Creator residency + concierge",
    recentPosts: [
      { id: "ig1", caption: "Studio drop", likes: 1200, comments: 54 },
      { id: "ig2", caption: "Residency reel", likes: 1500, comments: 70 }
    ]
  };
}

export async function getProfileStats(userId: string) {
  try {
    const token = await ensureSocialToken(userId, SocialPlatform.INSTAGRAM);
    if (!API_KEY) throw new Error("INSTAGRAM_API_KEY missing");
    const data = await simulateApiCall(token.id);
    return {
      platform: "INSTAGRAM",
      followers: data.followers,
      engagementRate: data.engagementRate,
      username: data.username,
      bio: data.bio
    };
  } catch (error) {
    throw createIntegrationError("instagram", error);
  }
}

export async function getLatestPosts(userId: string) {
  try {
    await ensureSocialToken(userId, SocialPlatform.INSTAGRAM);
    if (!API_KEY) throw new Error("INSTAGRAM_API_KEY missing");
    const data = await simulateApiCall(userId);
    return data.recentPosts;
  } catch (error) {
    throw createIntegrationError("instagram", error);
  }
}

export async function refreshToken(userId: string) {
  try {
    const token = await ensureSocialToken(userId, SocialPlatform.INSTAGRAM);
    const refreshed = {
      accessToken: `${token.accessToken || ""}-refreshed`,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
    };
    await prisma.socialToken.update({
      where: { id: token.id },
      data: refreshed
    });
    return { platform: "INSTAGRAM", refreshed: true };
  } catch (error) {
    throw createIntegrationError("instagram", error);
  }
}
