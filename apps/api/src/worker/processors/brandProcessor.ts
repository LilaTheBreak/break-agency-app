import { updateBrandScores } from "../../services/crm/brandRelationshipService.js";

export default async function brandProcessor(job: any) {
  const { userId, brandId } = job.data ?? {};
  if (!userId || !brandId) return;
  return updateBrandScores(userId, brandId);
}
