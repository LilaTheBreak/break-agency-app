import type { Job } from 'bullmq';
import { rewriteForPlatform } from '../../services/ai/aiCaptionRewriteService.js';

/**
 * Worker to run the AI caption rewrite pipeline.
 */
export default async function captionRewriteProcessor(job: Job<{ deliverableId: string; platform: string; options: any }>) {
  const { deliverableId, platform, options } = job.data;
  console.log(`[WORKER] Rewriting caption for deliverable ${deliverableId} for platform ${platform}`);
  await rewriteForPlatform(deliverableId, platform, options).catch(err => {
    console.error(`[WORKER ERROR] Caption rewrite failed for deliverable ${deliverableId}:`, err);
    throw err;
  });
}