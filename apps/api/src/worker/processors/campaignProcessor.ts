import { buildCampaignFromDeal } from "../../services/campaignBuilderService.js";

export default async function campaignProcessor(job: any) {
  const { dealDraftId } = job.data ?? {};
  if (!dealDraftId) return;
  await buildCampaignFromDeal(dealDraftId);
}
