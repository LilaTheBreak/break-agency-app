import { SocialPlatform } from "@prisma/client";
import prisma from "../../lib/prisma.js";
import { createIntegrationError, ensureSocialToken } from "./utils.js";

const API_KEY = process.env.TIKTOK_API_KEY || "";

export async function getProfileStats(userId: string) {
  try {
    await ensureSocialToken(userId, SocialPlatform.TIKTOK);
    if (!API_KEY) throw new Error("TIKTOK_API_KEY missing");
    return {
      platform: "TIKTOK",
      followers: 230000,
      engagementRate: 6.4,
      username: "breakco",
      bio: "AI prep. ops."
    };
  } catch (error) {
    throw createIntegrationError("tiktok", error);
  }
}

export async function getLatestPosts(userId: string) {
  try {
    await ensureSocialToken(userId, SocialPlatform.TIKTOK);
    if (!API_KEY) throw new Error("TIKTOK_API_KEY missing");
    return [
      { id: "tt1", caption: "Creator AMA", views: 42000 },
      { id: "tt2", caption: "Brief prep", views: 31000 }
    ];
  } catch (error) {
    throw createIntegrationError("tiktok", error);
  }
}

export async function refreshToken(userId: string) {
  try {
    const token = await ensureSocialToken(userId, SocialPlatform.TIKTOK);
    await prisma.socialToken.update({
      where: { id: token.id },
      data: {
        accessToken: `${token.accessToken || ""}-refreshed`,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
      }
    });
    return { platform: "TIKTOK", refreshed: true };
  } catch (error) {
    throw createIntegrationError("tiktok", error);
  }
}
