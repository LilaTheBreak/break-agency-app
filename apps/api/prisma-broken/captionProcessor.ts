import type { Job } from 'bullmq';
import { generateCaptions } from '../../services/ai/aiCaptionService.js';

/**
 * Worker to run the AI caption generation pipeline.
 */
export default async function captionProcessor(job: Job<{ conceptId: string; platform: string }>) {
  const { conceptId, platform } = job.data;
  console.log(`[WORKER] Generating captions for concept ${conceptId} for platform ${platform}`);
  await generateCaptions(conceptId, platform).catch(err => {
    console.error(`[WORKER ERROR] Caption generation failed for concept ${conceptId}:`, err);
    throw err;
  });
}