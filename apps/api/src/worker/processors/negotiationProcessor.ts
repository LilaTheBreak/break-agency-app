import { generateNegotiationInsight } from '../../services/negotiationInsightsService.js';

// Phase 3: Fail loudly - throw errors so BullMQ can retry
export default async function negotiationProcessor(job: any) {
  const dealDraftId = job.data?.dealDraftId;
  if (!dealDraftId) {
    throw new Error(`negotiationProcessor: missing dealDraftId in job data. Job data: ${JSON.stringify(job.data)}`);
  }
  await generateNegotiationInsight(dealDraftId);
}
