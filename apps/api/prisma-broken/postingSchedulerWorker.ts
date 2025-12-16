import { Job } from 'bullmq';
import { runPostingSchedulerWorker } from '../../services/ai/postingSchedulerService';

/**
 * Worker processor that runs periodically to publish scheduled posts.
 * This would be triggered by a cron job (e.g., every minute).
 */
export default async function postingSchedulerWorker(job: Job) {
  console.log('Running Posting Scheduler Worker...');
  try {
    await runPostingSchedulerWorker();
    console.log('Posting Scheduler Worker finished.');
    return { status: 'completed' };
  } catch (error) {
    console.error('Posting Scheduler Worker failed:', error);
    throw error;
  }
}