import prisma from "../lib/prisma.js";
import { SocialPlatform } from "@prisma/client";
import * as instagram from "../integrations/social/instagram.js";
import * as tiktok from "../integrations/social/tiktok.js";
import * as youtube from "../integrations/social/youtube.js";
import * as linkedin from "../integrations/social/linkedin.js";

const integrationMap = {
  [SocialPlatform.INSTAGRAM]: instagram,
  [SocialPlatform.TIKTOK]: tiktok,
  [SocialPlatform.YOUTUBE]: youtube,
  [SocialPlatform.LINKEDIN]: linkedin
};

export async function getStatsForUser(userId, platform) {
  const platforms = await resolvePlatforms(userId, platform);
  const results = await Promise.all(
    platforms.map(async (entry) => {
      const service = integrationMap[entry];
      if (!service?.getProfileStats) return null;
      const stats = await service.getProfileStats(userId);
      return { platform: entry, stats };
    })
  );
  return results.filter(Boolean);
}

export async function getPostsForUser(userId, platform) {
  const platforms = await resolvePlatforms(userId, platform);
  const results = await Promise.all(
    platforms.map(async (entry) => {
      const service = integrationMap[entry];
      if (!service?.getLatestPosts) return null;
      const posts = await service.getLatestPosts(userId);
      return { platform: entry, posts };
    })
  );
  return results.filter(Boolean);
}

export async function refreshSocialIntegrations(userId, platform) {
  const platforms = await resolvePlatforms(userId, platform);
  const results = await Promise.all(
    platforms.map(async (entry) => {
      const service = integrationMap[entry];
      if (!service?.refreshToken) return null;
      return service.refreshToken(userId);
    })
  );
  return results.filter(Boolean);
}

async function resolvePlatforms(userId, platform) {
  if (platform) return [platform];
  const tokens = await prisma.socialToken.findMany({
    where: { userId }
  });
  if (!tokens.length) {
    return [];
  }
  return tokens.map((token) => token.platform);
}
