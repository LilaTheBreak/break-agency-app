import { PrismaClient } from '@prisma/client';
import { performanceWorkerQueue } from '../worker/queues';

const prisma = new PrismaClient();

/**
 * Mock Social Media API Clients
 */
const socialApiClients = {
  instagram: {
    post: async (mediaUrl: string, caption: string) => {
      console.log(`Posting to Instagram: ${caption.substring(0, 30)}...`);
      if (Math.random() < 0.1) throw new Error('Instagram API daily limit reached.');
      return { postId: `ig_${Date.now()}` };
    },
  },
  tiktok: {
    post: async (mediaUrl: string, caption: string) => {
      console.log(`Posting to TikTok: ${caption.substring(0, 30)}...`);
      return { postId: `tk_${Date.now()}` };
    },
  },
};

/**
 * Creates a new post to be scheduled.
 */
export const createScheduledPost = async (data: {
  deliverableId: string;
  talentId: string;
  platform: string;
  scheduledAt: Date;
  caption?: string;
  mediaUrl?: string;
}) => {
  return prisma.scheduledPost.create({ data });
};

/**
 * Updates an existing scheduled post.
 */
export const updateScheduledPost = async (postId: string, data: { scheduledAt?: Date; caption?: string }) => {
  return prisma.scheduledPost.update({
    where: { id: postId },
    data,
  });
};

/**
 * Cancels (deletes) a scheduled post.
 */
export const cancelScheduledPost = async (postId: string) => {
  return prisma.scheduledPost.delete({ where: { id: postId } });
};

/**
 * Simulates an AI fetching the best time to post for a user.
 */
export const fetchRecommendedPostTime = async (userId: string) => {
  // Mock logic: recommend 7 PM tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(19, 0, 0, 0);
  return {
    time: tomorrow,
    reason: 'Based on your audience activity, 7 PM is a peak engagement time.',
  };
};

/**
 * The core worker logic for finding and posting due content.
 */
export const runAutoPostingWorker = async () => {
  const now = new Date();
  const postsToPublish = await prisma.scheduledPost.findMany({
    where: {
      status: 'approved', // Only post approved content
      scheduledAt: { lte: now },
    },
  });

  for (const post of postsToPublish) {
    try {
      await prisma.scheduledPost.update({ where: { id: post.id }, data: { status: 'processing' } });

      const client = socialApiClients[post.platform.toLowerCase()];
      if (!client) throw new Error(`Unsupported platform: ${post.platform}`);

      const result = await client.post(post.mediaUrl, post.caption);

      await prisma.scheduledPost.update({
        where: { id: post.id },
        data: { status: 'posted', postedAt: new Date(), metadata: result },
      });

      await prisma.autoPostLog.create({
        data: { scheduledPostId: post.id, status: 'success', message: `Posted successfully with ID: ${result.postId}` },
      });

      // Trigger performance worker to start tracking the post
      await performanceWorkerQueue.add('track-performance', { postId: post.id, platformPostId: result.postId }, { delay: 1000 * 60 * 60 }); // Check in 1 hour
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      await prisma.scheduledPost.update({
        where: { id: post.id },
        data: { status: 'failed', error: errorMessage },
      });
      await prisma.autoPostLog.create({
        data: { scheduledPostId: post.id, status: 'failure', message: errorMessage },
      });
    }
  }
  return postsToPublish.length;
};