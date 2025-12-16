import type { Job } from 'bullmq';
import { runFinalisationPipeline } from '../../pipelines/finalisationPipeline.js';

/**
 * Worker to run the deal finalization pipeline.
 */
export default async function finalisationWorker(job: Job<{ threadId: string }>) {
  const { threadId } = job.data;
  console.log(`[WORKER] Running finalisation for thread: ${threadId}`);
  await runFinalisationPipeline(threadId).catch(err => {
    console.error(`[WORKER ERROR] Finalisation failed for thread ${threadId}:`, err);
    throw err;
  });
}