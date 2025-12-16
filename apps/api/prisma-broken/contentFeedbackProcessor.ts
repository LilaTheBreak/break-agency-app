import type { Job } from 'bullmq';
import { applyAIRevisions } from '../../services/ai/aiRevisionService.js';

/**
 * Worker to run the AI revision pipeline based on feedback.
 */
export default async function contentFeedbackProcessor(job: Job<{ contentItemId: string }>) {
  const { contentItemId } = job.data;
  console.log(`[WORKER] Applying AI revisions for content item: ${contentItemId}`);
  await applyAIRevisions(contentItemId).catch(err => {
    console.error(`[WORKER ERROR] AI revision failed for content item ${contentItemId}:`, err);
    throw err;
  });
}