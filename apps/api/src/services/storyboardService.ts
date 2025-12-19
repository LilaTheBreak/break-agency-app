import { runCampaignLLM } from "./ai/campaignLLM.js";

/**
 * Generates a storyboard (shot guide + scripts) for a campaign.
 * @param campaignData - The campaign brief, creative concepts, and deliverables.
 * @returns A structured storyboard.
 */
export async function generateStoryboard(campaignData: any) {
  const storyboardResult = await runCampaignLLM(campaignData, "generate_storyboard");

  if (!storyboardResult.ok) {
    return {
      shotGuide: [],
      scriptBeats: [],
      error: "Storyboard generation failed.",
    };
  }
  return storyboardResult.data.storyboard;
}