import { runCampaignPrediction } from "../../services/strategy/strategyEngine.js";

export default async function strategyProcessor(job: any) {
  const { userId, brandName } = job.data ?? {};
  if (!userId || !brandName) return;
  return runCampaignPrediction(userId, brandName);
}
