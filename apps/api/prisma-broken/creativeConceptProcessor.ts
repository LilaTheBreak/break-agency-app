import type { Job } from 'bullmq';
import { generateConcept } from '../../services/ai/aiCreativeConceptService.js';

/**
 * Worker to run the AI creative concept generation pipeline.
 */
export default async function creativeConceptProcessor(job: Job<{ deliverableId: string; platform: string; options: any }>) {
  const { deliverableId, platform, options } = job.data;
  console.log(`[WORKER] Generating creative concept for deliverable ${deliverableId} for platform ${platform}`);
  await generateConcept(deliverableId, platform, options).catch(err => {
    console.error(`[WORKER ERROR] Creative concept generation failed for deliverable ${deliverableId}:`, err);
    throw err;
  });
}