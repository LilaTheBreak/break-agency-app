import prisma from '../../lib/prisma.js';
import { postingQueue } from '../../worker/queues/postingQueue.js';

/**
 * Adds a deliverable to the posting queue.
 * @param deliverableId - The ID of the deliverable to queue.
 * @param platform - The target social media platform.
 * @param payload - The content to be posted.
 * @param scheduledFor - Optional date to schedule the post for.
 */
export async function queuePost(deliverableId: string, platform: string, payload: any, scheduledFor?: Date) {
  const job = await prisma.postingQueue.create({
    data: {
      deliverableId,
      platform,
      payload,
      scheduledFor,
      status: 'queued',
    },
  });

  await postingQueue.add('publish-post', { postingQueueId: job.id }, { delay: scheduledFor ? scheduledFor.getTime() - Date.now() : 0 });

  return job;
}