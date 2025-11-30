import type { Job } from 'bullmq';
import { generateCampaignDeck } from '../../services/deck/deckGenerator.js';

/**
 * Worker to generate a campaign pitch deck from an AI plan.
 */
export default async function campaignDeckWorker(job: Job<{ aiPlanId: string }>) {
  const { aiPlanId } = job.data;
  console.log(`[WORKER] Generating campaign deck for AI plan: ${aiPlanId}`);
  await generateCampaignDeck(aiPlanId).catch(err => {
    console.error(`[WORKER ERROR] Deck generation failed for plan ${aiPlanId}:`, err);
    throw err;
  });
}