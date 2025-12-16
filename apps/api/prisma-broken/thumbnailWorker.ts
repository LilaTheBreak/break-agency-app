import { Job } from 'bullmq';
import { generateThumbnailsForDeliverable } from '../../services/ai/thumbnailService';

interface ThumbnailJobData {
  deliverableId: string;
  userId: string;
}

/**
 * Worker processor that generates thumbnails for a deliverable.
 */
export default async function thumbnailWorker(job: Job<ThumbnailJobData>) {
  const { deliverableId, userId } = job.data;
  console.log(`Running Thumbnail Worker for deliverable: ${deliverableId}`);

  try {
    await generateThumbnailsForDeliverable(deliverableId, userId);
    console.log(`Successfully generated thumbnails for deliverable ${deliverableId}`);

    // Optionally, trigger a notification to the user
    // await notificationQueue.add(...)
  } catch (error) {
    console.error(`Thumbnail Worker failed for deliverable ${deliverableId}:`, error);
    throw error;
  }
}