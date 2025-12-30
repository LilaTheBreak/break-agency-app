import { runCreatorFit } from "../../services/strategy/creatorFitService.js";

// Phase 3: Fail loudly - throw errors so BullMQ can retry
export default async function creatorFitProcessor(job: any) {
  const { userId, brandPrediction } = job.data ?? {};
  if (!userId || !brandPrediction) {
    throw new Error(`creatorFitProcessor: missing userId or brandPrediction in job data. Job data: ${JSON.stringify(job.data)}`);
  }
  return runCreatorFit(userId, brandPrediction);
}
