import type { Job } from 'bullmq';
import prisma from '../../lib/prisma.js';
import * as tiktok from '../../integrations/social/postToTikTok.js';
// Import other publishers...

/**
 * A helper function to route a posting job to the correct publisher service.
 */
async function runPublisher(platform: string, payload: any) {
  switch (platform.toLowerCase()) {
    case 'tiktok':
      return tiktok.publish(payload);
    // Add cases for 'instagram', 'youtube', etc.
    default:
      throw new Error(`Unsupported platform for posting: ${platform}`);
  }
}

/**
 * Worker to process a single post from the scheduler queue.
 */
export default async function postSchedulerProcessor(job: Job<{ scheduledPostId: string }>) {
  const { scheduledPostId } = job.data;
  console.log(`[WORKER] Publishing scheduled post: ${scheduledPostId}`);

  const post = await prisma.scheduledPost.findUnique({ where: { id: scheduledPostId } });
  if (!post || post.status !== 'queued') {
    console.warn(`Scheduled post ${scheduledPostId} not found or not in a 'queued' state.`);
    return;
  }

  try {
    await prisma.scheduledPost.update({ where: { id: scheduledPostId }, data: { status: 'posting' } });
    const { postedUrl } = await runPublisher(post.platform, { caption: post.caption, mediaUrl: post.mediaUrl });
    await prisma.scheduledPost.update({ where: { id: scheduledPostId }, data: { status: 'posted', postedAt: new Date(), metadata: { postedUrl } } });
  } catch (error: any) {
    console.error(`[WORKER ERROR] Failed to publish post ${scheduledPostId}:`, error);
    await prisma.scheduledPost.update({ where: { id: scheduledPostId }, data: { status: 'failed', error: error.message } });
  }
}