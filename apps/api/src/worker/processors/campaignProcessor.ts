import { buildCampaignFromDeal } from '../../services/campaignBuilderService.js';

// Phase 3: Fail loudly - throw errors so BullMQ can retry
export default async function campaignProcessor(job: any) {
  const { dealDraftId } = job.data ?? {};
  if (!dealDraftId) {
    throw new Error(`campaignProcessor: missing dealDraftId in job data. Job data: ${JSON.stringify(job.data)}`);
  }
  await buildCampaignFromDeal(dealDraftId);
}
