import type { Job } from 'bullmq';
import { generateShotList } from '../../services/ai/aiShotListService.js';

/**
 * Worker to run the AI shot list generation pipeline.
 */
export default async function shotListProcessor(job: Job<{ conceptId: string }>) {
  const { conceptId } = job.data;
  console.log(`[WORKER] Generating shot list for concept: ${conceptId}`);
  await generateShotList(conceptId).catch(err => {
    console.error(`[WORKER ERROR] Shot list generation failed for concept ${conceptId}:`, err);
    throw err;
  });
}