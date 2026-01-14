import { runCampaignLLM } from './ai/campaignLLM';

/**
 * Generates quantitative predictions for a campaign.
 * @param campaignData - The campaign brief, deliverables, and talent info.
 * @returns Predicted impressions, ER, engagement counts, and confidence bands.
 */
export async function generateCampaignForecast(campaignData: any) {
  const forecastResult = await runCampaignLLM(campaignData, "generate_forecast");

  if (!forecastResult.ok) {
    return {
      impressions: 0,
      engagementRate: 0,
      confidence: 0.1,
      error: "Forecast generation failed.",
    };
  }
  return forecastResult.data.forecast;
}