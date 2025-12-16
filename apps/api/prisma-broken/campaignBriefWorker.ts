import type { Job } from 'bullmq';
import { generateAutoBrief } from '../../services/campaign/autoBriefEngine.js';

/**
 * Worker to generate an AI campaign brief for a deal draft.
 */
export default async function campaignBriefWorker(job: Job<{ dealDraftId: string }>) {
  const { dealDraftId } = job.data;
  console.log(`[WORKER] Generating campaign brief for deal draft: ${dealDraftId}`);
  await generateAutoBrief(dealDraftId).catch(err => {
    console.error(`[WORKER ERROR] Campaign brief generation failed for ${dealDraftId}:`, err);
    throw err;
  });
}