/**
 * Social Data Ingestion Queue
 * 
 * Background job system for fetching and populating social profile data
 * Handles rate limiting, retries, and error reporting
 */

import Bull from "bull";
import { prisma } from "../../db/prisma.js";
import { redis } from "../../services/redis.js";
import {
  fetchInstagramProfileData,
  fetchInstagramPosts,
  fetchTikTokProfileData,
  fetchTikTokPosts,
  fetchYouTubeProfileData,
  fetchYouTubePosts,
} from "../../services/socialDataFetchers.js";

export interface SocialDataIngestJob {
  connectionId: string;
  talentId: string;
  platform: string;
  handle: string;
  connectionType: "MANUAL" | "OAUTH";
}

const ingestQueue = new Bull<SocialDataIngestJob>("social-data-ingest", {
  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379"),
    password: process.env.REDIS_PASSWORD,
  },
});

/**
 * Process social data ingestion jobs
 */
ingestQueue.process(async (job) => {
  const { connectionId, talentId, platform, handle, connectionType } = job.data;
  const jobId = job.id;

  console.log(`[SOCIAL_INGEST] Starting job #${jobId}:`, {
    connectionId,
    platform,
    handle,
  });

  try {
    // Update status to SYNCING
    await prisma.socialAccountConnection.update({
      where: { id: connectionId },
      data: {
        syncStatus: "SYNCING",
        updatedAt: new Date(),
      },
    });

    const connection = await prisma.socialAccountConnection.findUnique({
      where: { id: connectionId },
    });

    if (!connection) {
      throw new Error("Connection not found");
    }

    // Fetch profile data based on platform
    let profileData: any;
    let posts: any[] = [];

    if (platform === "INSTAGRAM") {
      if (connectionType === "OAUTH" && connection.accessToken) {
        // OAuth flow - use access token
        profileData = await fetchInstagramProfileData({
          handle,
          accessToken: connection.accessToken,
        });
        posts = await fetchInstagramPosts({
          handle,
          accessToken: connection.accessToken,
        });
      } else {
        // Manual flow - scrape public data
        profileData = await fetchInstagramProfileData({ handle });
        posts = await fetchInstagramPosts({ handle });
      }
    } else if (platform === "TIKTOK") {
      if (connectionType === "OAUTH" && connection.accessToken) {
        profileData = await fetchTikTokProfileData({
          handle,
          accessToken: connection.accessToken,
        });
        posts = await fetchTikTokPosts({
          handle,
          accessToken: connection.accessToken,
        });
      } else {
        profileData = await fetchTikTokProfileData({ handle });
        posts = await fetchTikTokPosts({ handle });
      }
    } else if (platform === "YOUTUBE") {
      if (connectionType === "OAUTH" && connection.accessToken) {
        profileData = await fetchYouTubeProfileData({
          handle,
          accessToken: connection.accessToken,
        });
        posts = await fetchYouTubePosts({
          handle,
          accessToken: connection.accessToken,
        });
      } else {
        profileData = await fetchYouTubeProfileData({ handle });
        posts = await fetchYouTubePosts({ handle });
      }
    }

    // Create or update SocialProfile
    const profile = await prisma.socialProfile.upsert({
      where: { connectionId },
      update: {
        displayName: profileData.displayName,
        bio: profileData.bio,
        profileImageUrl: profileData.profileImageUrl,
        followerCount: profileData.followerCount || 0,
        followingCount: profileData.followingCount,
        postCount: profileData.postCount,
        averageViews: profileData.averageViews,
        averageEngagement: profileData.averageEngagement,
        engagementRate: profileData.engagementRate,
        isVerified: profileData.isVerified || false,
        externalId: profileData.externalId,
        lastSyncedAt: new Date(),
        updatedAt: new Date(),
      },
      create: {
        id: `prof_${connectionId}_${Date.now()}`,
        connectionId,
        platform,
        handle,
        displayName: profileData.displayName,
        bio: profileData.bio,
        profileImageUrl: profileData.profileImageUrl,
        followerCount: profileData.followerCount || 0,
        followingCount: profileData.followingCount,
        postCount: profileData.postCount,
        averageViews: profileData.averageViews,
        averageEngagement: profileData.averageEngagement,
        engagementRate: profileData.engagementRate,
        isVerified: profileData.isVerified || false,
        externalId: profileData.externalId,
        lastSyncedAt: new Date(),
      },
    });

    // Insert posts (delete old ones first)
    if (posts.length > 0) {
      await prisma.socialPost.deleteMany({
        where: { profileId: profile.id },
      });

      await prisma.socialPost.createMany({
        data: posts.map((post) => ({
          id: `post_${post.externalId}_${Date.now()}`,
          profileId: profile.id,
          platform,
          externalId: post.externalId,
          url: post.url,
          caption: post.caption,
          mediaType: post.mediaType, // IMAGE, VIDEO, CAROUSEL
          publishedAt: new Date(post.publishedAt),
          likes: post.likes || 0,
          comments: post.comments || 0,
          shares: post.shares || 0,
          views: post.views || 0,
          saves: post.saves || 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
      });
    }

    // Update connection status to READY
    await prisma.socialAccountConnection.update({
      where: { id: connectionId },
      data: {
        syncStatus: "READY",
        lastSyncedAt: new Date(),
        syncError: null,
        updatedAt: new Date(),
      },
    });

    // Clear cache
    await redis.del(`social_intel:${talentId}`).catch(console.warn);

    console.log(`[SOCIAL_INGEST] Job #${jobId} completed successfully:`, {
      connectionId,
      profileId: profile.id,
      postsCount: posts.length,
    });

    return {
      success: true,
      connectionId,
      profileId: profile.id,
      postsCount: posts.length,
    };
  } catch (error) {
    console.error(`[SOCIAL_INGEST] Job #${jobId} failed:`, error);

    // Update connection with error status
    await prisma.socialAccountConnection.update({
      where: { id: connectionId },
      data: {
        syncStatus: "ERROR",
        syncError: error instanceof Error ? error.message : "Unknown error",
        updatedAt: new Date(),
      },
    }).catch(console.warn);

    throw error; // Let Bull handle retry logic
  }
});

/**
 * Job event handlers
 */
ingestQueue.on("completed", (job) => {
  console.log(`[SOCIAL_INGEST] Job #${job.id} completed`);
});

ingestQueue.on("failed", (job, err) => {
  console.error(`[SOCIAL_INGEST] Job #${job.id} failed:`, err.message);
});

ingestQueue.on("error", (error) => {
  console.error("[SOCIAL_INGEST] Queue error:", error);
});

/**
 * Queue a social data ingestion job
 */
export async function queueSocialDataIngest(data: SocialDataIngestJob) {
  try {
    const job = await ingestQueue.add(data, {
      attempts: 3, // Retry 3 times
      backoff: {
        type: "exponential",
        delay: 2000, // Start with 2 seconds
      },
      removeOnComplete: true,
      removeOnFail: false, // Keep failed jobs for debugging
    });

    console.log("[SOCIAL_INGEST] Queued job #" + job.id, data);
    return job;
  } catch (error) {
    console.error("[SOCIAL_INGEST] Failed to queue job:", error);
    throw error;
  }
}

/**
 * Get job status
 */
export async function getSocialIngestJobStatus(jobId: number) {
  const job = await ingestQueue.getJob(jobId);
  if (!job) return null;

  return {
    id: job.id,
    state: await job.getState(),
    progress: job.progress(),
    data: job.data,
    failedReason: job.failedReason,
  };
}

/**
 * Retry failed connection
 */
export async function retrySocialIngest(connectionId: string) {
  const connection = await prisma.socialAccountConnection.findUnique({
    where: { id: connectionId },
  });

  if (!connection) {
    throw new Error("Connection not found");
  }

  return queueSocialDataIngest({
    connectionId,
    talentId: connection.creatorId,
    platform: connection.platform,
    handle: connection.handle,
    connectionType: connection.connectionType as "MANUAL" | "OAUTH",
  });
}

export default ingestQueue;
