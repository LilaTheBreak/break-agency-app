import { SocialPlatform } from "@prisma/client";
import prisma from "../../lib/prisma.js";
import { createIntegrationError, ensureSocialToken } from "./utils.js";

const API_KEY = process.env.LINKEDIN_API_KEY || "";

export async function getProfileStats(userId: string) {
  try {
    await ensureSocialToken(userId, SocialPlatform.LINKEDIN);
    if (!API_KEY) throw new Error("LINKEDIN_API_KEY missing");
    return {
      platform: "LINKEDIN",
      followers: 56000,
      engagementRate: 3.3,
      headline: "Founder / Creator partnerships",
      pageUrl: "https://www.linkedin.com/company/thebreakco"
    };
  } catch (error) {
    throw createIntegrationError("linkedin", error);
  }
}

export async function getLatestPosts(userId: string) {
  try {
    await ensureSocialToken(userId, SocialPlatform.LINKEDIN);
    if (!API_KEY) throw new Error("LINKEDIN_API_KEY missing");
    return [
      { id: "li1", title: "Break newsletter", reactions: 320 },
      { id: "li2", title: "Creator residency update", reactions: 410 }
    ];
  } catch (error) {
    throw createIntegrationError("linkedin", error);
  }
}

export async function refreshToken(userId: string) {
  try {
    const token = await ensureSocialToken(userId, SocialPlatform.LINKEDIN);
    await prisma.socialToken.update({
      where: { id: token.id },
      data: {
        accessToken: `${token.accessToken || ""}-refreshed`,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
      }
    });
    return { platform: "LINKEDIN", refreshed: true };
  } catch (error) {
    throw createIntegrationError("linkedin", error);
  }
}
