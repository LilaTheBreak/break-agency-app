import { runCreatorFit } from "../../services/strategy/creatorFitService.js";

export default async function creatorFitProcessor(job: any) {
  const { userId, brandPrediction } = job.data ?? {};
  if (!userId || !brandPrediction) return;
  return runCreatorFit(userId, brandPrediction);
}
