import { runCampaignLLM } from './ai/campaignLLM';

/**
 * Generates creative direction for a campaign.
 * @param campaignData - The campaign brief and brand profile.
 * @returns Tone, visual style, sample copy, and moodboard references.
 */
export async function generateCreativeDirection(campaignData: any) {
  const creativeDirectionResult = await runCampaignLLM(campaignData, "generate_creative_direction");

  if (!creativeDirectionResult.ok) {
    return {
      tone: "neutral",
      visualStyle: "clean",
      error: "Creative direction generation failed.",
    };
  }
  return creativeDirectionResult.data.creativeDirection;
}