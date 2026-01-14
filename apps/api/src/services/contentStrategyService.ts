import { runCampaignLLM } from './ai/campaignLLM';

/**
 * Generates content strategy details for a campaign.
 * @param campaignData - The campaign brief, creative concepts, and deliverables.
 * @returns Posting cadence, hooks, CTAs, and platform-specific messaging.
 */
export async function generateContentStrategy(campaignData: any) {
  const contentStrategyResult = await runCampaignLLM(campaignData, "generate_content_strategy");

  if (!contentStrategyResult.ok) {
    return {
      hooks: [],
      schedule: {},
      error: "Content strategy generation failed.",
    };
  }
  return contentStrategyResult.data.contentStrategy;
}