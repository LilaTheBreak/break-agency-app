import { Prisma, type SocialPlatform } from "@prisma/client";
import prisma from "../lib/prisma.js";
import { TTLCache } from "../lib/cache.js";
import {
  exchangeCodeForToken,
  fetchAnalyticsSnapshot,
  fetchSocialPosts,
  fetchSocialProfile
} from "../lib/socialIntegrations.js";

const socialCache = new TTLCache<any>(1000 * 60 * 10);

export async function connectSocialAccount({
  userId,
  platform,
  code,
  redirectUri
}: {
  userId: string;
  platform: SocialPlatform;
  code: string;
  redirectUri: string;
}) {
  const tokenResponse = await exchangeCodeForToken(platform, code, redirectUri);
  const profile = await fetchSocialProfile(platform, tokenResponse.accessToken);

  const account = await prisma.socialAccount.upsert({
    where: {
      platform_platformUserId: {
        platform,
        platformUserId: profile.platformUserId
      }
    },
    update: {
      userId,
      username: profile.username,
      displayName: profile.displayName,
      profileUrl: profile.profileUrl,
      profileImage: profile.profileImage,
      bio: profile.bio,
      followers: profile.followers ?? 0,
      following: profile.following ?? 0,
      accessToken: tokenResponse.accessToken,
      refreshToken: tokenResponse.refreshToken,
      tokenExpiresAt: tokenResponse.expiresIn ? new Date(Date.now() + tokenResponse.expiresIn * 1000) : null,
      metadata: toJson(profile.metrics ?? {})
    },
    create: {
      userId,
      platform,
      platformUserId: profile.platformUserId,
      username: profile.username,
      displayName: profile.displayName,
      profileUrl: profile.profileUrl,
      profileImage: profile.profileImage,
      bio: profile.bio,
      followers: profile.followers ?? 0,
      following: profile.following ?? 0,
      accessToken: tokenResponse.accessToken,
      refreshToken: tokenResponse.refreshToken,
      tokenExpiresAt: tokenResponse.expiresIn ? new Date(Date.now() + tokenResponse.expiresIn * 1000) : null,
      metadata: toJson(profile.metrics ?? {})
    }
  });

  await syncAnalyticsForAccount(account.id, platform, tokenResponse.accessToken);

  socialCache.delete(cacheKey(userId));

  return account;
}

export async function getSocialAnalyticsForUser(userId: string) {
  const key = cacheKey(userId);
  const cached = socialCache.get(key);
  if (cached) return cached;

  const accounts = await prisma.socialAccount.findMany({
    where: { userId },
    include: {
      analytics: {
        take: 5,
        orderBy: { capturedAt: "desc" }
      },
      posts: {
        take: 6,
        orderBy: { postedAt: "desc" }
      }
    },
    orderBy: { createdAt: "asc" }
  });

  const response = {
    accounts: accounts.map((account) => ({
      id: account.id,
      platform: account.platform,
      username: account.username,
      displayName: account.displayName,
      profileUrl: account.profileUrl,
      profileImage: account.profileImage,
      followers: account.followers,
      engagementRate: account.analytics[0]?.engagementRate ?? null,
      velocityScore: account.analytics[0]?.velocityScore ?? null,
      trend: account.analytics.map((data) => ({
        capturedAt: data.capturedAt,
        followerCount: data.followerCount,
        engagementRate: data.engagementRate
      })),
      posts: account.posts
    }))
  };

  socialCache.set(key, response);
  return response;
}

export async function refreshSocialAnalytics({
  userId,
  platforms
}: {
  userId: string;
  platforms?: SocialPlatform[];
}) {
  const accounts = await prisma.socialAccount.findMany({
    where: {
      userId,
      ...(platforms ? { platform: { in: platforms } } : {})
    }
  });

  for (const account of accounts) {
    const accessToken = account.accessToken;
    if (!accessToken) continue;
    try {
      await syncAnalyticsForAccount(account.id, account.platform, accessToken);
    } catch (error) {
      console.error("refreshSocialAnalytics error", error);
      if (error instanceof Error && error.message.includes("expired")) {
        await prisma.socialAccount.update({
          where: { id: account.id },
          data: {
            metadata: toJson({ ...(account.metadata ?? {}), tokenStatus: "expired" })
          }
        });
      }
    }
  }

  socialCache.delete(cacheKey(userId));

  return getSocialAnalyticsForUser(userId);
}

async function syncAnalyticsForAccount(accountId: string, platform: SocialPlatform, accessToken: string) {
  const account = await prisma.socialAccount.findUnique({ where: { id: accountId } });
  if (!account) throw new Error("Account not found");

  const [analytics, posts] = await Promise.all([
    fetchAnalyticsSnapshot(platform, accessToken),
    fetchSocialPosts(platform, accessToken)
  ]);

  await prisma.socialAnalytics.create({
    data: {
      userId: account.userId,
      accountId,
      followerCount: analytics.followerCount,
      engagementRate: analytics.engagementRate ?? null,
      velocityScore: analytics.velocityScore ?? null,
      reach: analytics.reach ?? null,
      profileViews: analytics.profileViews ?? null,
      demographics: analytics.demographics
        ? (toJson(analytics.demographics) as Prisma.JsonObject)
        : null,
      raw: toJson(analytics)
    }
  });

  await prisma.socialAccount.update({
    where: { id: accountId },
    data: {
      followers: analytics.followerCount,
      metadata: toJson({
        ...(account.metadata ?? {}),
        demographics: analytics.demographics,
        velocityScore: analytics.velocityScore
      }) as Prisma.JsonObject,
      updatedAt: new Date()
    }
  });

  if (posts.length) {
    await prisma.socialPost.createMany({
      skipDuplicates: true,
      data: posts.map((post) => ({
        userId: account.userId,
        accountId: account.id,
        platform,
        platformPostId: post.platformPostId,
        caption: post.caption,
        mediaUrl: post.mediaUrl,
        thumbnailUrl: post.thumbnailUrl,
        postedAt: post.postedAt,
        likes: post.likes,
        comments: post.comments,
        shares: post.shares,
        views: post.views,
        engagementRate: post.engagementRate,
        metadata: toJson(post.metadata ?? {})
      }))
    });
  }
}

function cacheKey(userId: string) {
  return `social:${userId}`;
}

function toJson(value: unknown): Prisma.InputJsonValue {
  try {
    return JSON.parse(JSON.stringify(value ?? null)) as Prisma.InputJsonValue;
  } catch {
    return (value ?? null) as Prisma.InputJsonValue;
  }
}
