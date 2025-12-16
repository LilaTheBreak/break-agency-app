import { Job } from 'bullmq';
import { generateHashtagsForDeliverable } from '../../services/ai/hashtagService';

interface HashtagJobData {
  deliverableId: string;
}

/**
 * Worker processor that generates hashtags for a deliverable.
 */
export default async function hashtagWorker(job: Job<HashtagJobData>) {
  const { deliverableId } = job.data;
  console.log(`Running Hashtag Worker for deliverable: ${deliverableId}`);

  try {
    await generateHashtagsForDeliverable(deliverableId);
    console.log(`Successfully generated hashtags for deliverable ${deliverableId}`);

    // Optionally, trigger a notification to the user
  } catch (error) {
    console.error(`Hashtag Worker failed for deliverable ${deliverableId}:`, error);
    throw error;
  }
}