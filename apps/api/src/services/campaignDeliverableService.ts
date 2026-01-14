import { runCampaignLLM } from './ai/campaignLLM';

/**
 * Generates a list of deliverables for a campaign.
 * @param campaignData - The campaign brief, budget, and creative concepts.
 * @returns A list of deliverable types, platforms, deadlines, and cost ranges.
 */
export async function generateCampaignDeliverables(campaignData: any) {
  const deliverablesResult = await runCampaignLLM(campaignData, "generate_deliverables");

  if (!deliverablesResult.ok) {
    return {
      deliverables: [],
      error: "Deliverable generation failed.",
    };
  }
  return deliverablesResult.data.deliverables;
}