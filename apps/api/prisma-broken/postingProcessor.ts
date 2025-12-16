import type { Job } from 'bullmq';
import prisma from '../../lib/prisma.js';
import { publishToTikTok } from '../../services/posting/publisherTikTok.js';
// Import other publishers like publishToInstagram, etc.

/**
 * A helper function to route a posting job to the correct publisher service.
 */
async function runPublisher(platform: string, payload: any) {
  switch (platform.toLowerCase()) {
    case 'tiktok':
      return publishToTikTok(payload);
    // Add cases for 'instagram', 'youtube', etc.
    default:
      throw new Error(`Unsupported platform for posting: ${platform}`);
  }
}

/**
 * Worker to process a single post from the posting queue.
 */
export default async function postingProcessor(job: Job<{ postingQueueId: string }>) {
  const { postingQueueId } = job.data;
  console.log(`[WORKER] Processing post from queue: ${postingQueueId}`);

  const queueItem = await prisma.postingQueue.findUnique({ where: { id: postingQueueId } });
  if (!queueItem || queueItem.status !== 'queued') {
    console.warn(`Queue item ${postingQueueId} not found or not in a queued state.`);
    return;
  }

  await prisma.postingQueue.update({ where: { id: postingQueueId }, data: { status: 'processing' } });
  const result = await runPublisher(queueItem.platform, queueItem.payload);
  await prisma.postingQueue.update({ where: { id: postingQueueId }, data: { status: 'completed' } });
  await prisma.deliverableItem.update({ where: { id: queueItem.deliverableId }, data: { postingStatus: 'posted', postedUrl: result.postedUrl, postedAt: new Date() } });
}