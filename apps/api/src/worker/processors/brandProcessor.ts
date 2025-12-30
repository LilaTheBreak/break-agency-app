import { updateBrandScores } from "../../services/crm/brandRelationshipService.js";

// Phase 3: Fail loudly - throw errors so BullMQ can retry
export default async function brandProcessor(job: any) {
  const { userId, brandId } = job.data ?? {};
  if (!userId || !brandId) {
    throw new Error(`brandProcessor: missing userId or brandId in job data. Job data: ${JSON.stringify(job.data)}`);
  }
  return updateBrandScores(userId, brandId);
}
