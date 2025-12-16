import type { Job } from 'bullmq';
import { generateMoodboard } from '../../services/ai/aiMoodboardService.js';

/**
 * Worker to run the AI moodboard generation pipeline.
 */
export default async function moodboardProcessor(job: Job<{ conceptId: string }>) {
  const { conceptId } = job.data;
  console.log(`[WORKER] Generating moodboard for concept: ${conceptId}`);
  await generateMoodboard(conceptId).catch(err => {
    console.error(`[WORKER ERROR] Moodboard generation failed for concept ${conceptId}:`, err);
    throw err;
  });
}