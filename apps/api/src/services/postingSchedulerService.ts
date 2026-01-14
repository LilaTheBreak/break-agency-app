import { runCampaignLLM } from './ai/campaignLLM';

/**
 * Generates a full publishing calendar for a campaign.
 * @param campaignData - The campaign timeline and deliverables.
 * @returns A calendar with recommended posting windows and frequency suggestions.
 */
export async function generatePostingSchedule(campaignData: any) {
  const postingScheduleResult = await runCampaignLLM(campaignData, "generate_posting_schedule");

  if (!postingScheduleResult.ok) {
    return {
      calendar: [],
      error: "Posting schedule generation failed.",
    };
  }
  return postingScheduleResult.data.postingSchedule;
}