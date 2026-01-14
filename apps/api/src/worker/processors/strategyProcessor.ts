import { runCampaignPrediction } from '../../services/strategy/strategyEngine.js';

// Phase 3: Fail loudly - throw errors so BullMQ can retry
export default async function strategyProcessor(job: any) {
  const { userId, brandName } = job.data ?? {};
  if (!userId || !brandName) {
    throw new Error(`strategyProcessor: missing userId or brandName in job data. Job data: ${JSON.stringify(job.data)}`);
  }
  return runCampaignPrediction(userId, brandName);
}
