import { runCampaignLLM } from "./ai/campaignLLM.js";

/**
 * Generates sets of hashtags for a campaign.
 * @param campaignData - The campaign brief and creative concepts.
 * @returns Hero, Performance, and Niche hashtag sets.
 */
export async function generateHashtags(campaignData: any) {
  const hashtagsResult = await runCampaignLLM(campaignData, "generate_hashtags");

  if (!hashtagsResult.ok) {
    return {
      hero: [],
      performance: [],
      niche: [],
      error: "Hashtag generation failed.",
    };
  }
  return hashtagsResult.data.hashtags;
}