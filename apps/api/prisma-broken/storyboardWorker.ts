import { Job } from 'bullmq';
import { generateFullStoryboard } from '../../services/ai/storyboardService';

interface StoryboardJobData {
  deliverableId: string;
}

/**
 * Worker processor that generates a storyboard for a deliverable.
 */
export default async function storyboardWorker(job: Job<StoryboardJobData>) {
  const { deliverableId } = job.data;
  console.log(`Running Storyboard Worker for deliverable: ${deliverableId}`);

  try {
    await generateFullStoryboard(deliverableId);
    console.log(`Successfully generated storyboard for deliverable ${deliverableId}`);

    // Optionally, trigger a notification to the user
    // await notificationQueue.add(...)

    return { status: 'completed' };
  } catch (error) {
    console.error(`Storyboard Worker failed for deliverable ${deliverableId}:`, error);
    throw error;
  }
}