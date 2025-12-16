import { Job } from 'bullmq';
import { runAutoPostingWorker } from '../services/schedulerService';

/**
 * Worker processor that runs periodically to check for and publish scheduled posts.
 * This would be triggered by a cron job (e.g., every minute).
 */
export default async function postSchedulerWorker(job: Job) {
  console.log('Running Post Scheduler Worker...');
  try {
    const postsPublished = await runAutoPostingWorker();
    console.log(`Post Scheduler Worker finished. Published ${postsPublished} posts.`);
    return { status: 'completed', published: postsPublished };
  } catch (error) {
    console.error('Post Scheduler Worker failed:', error);
    throw error;
  }
}