import { generateNegotiationInsight } from "../../services/negotiationInsightsService.js";

export default async function negotiationProcessor(job: any) {
  const dealDraftId = job.data?.dealDraftId;
  if (!dealDraftId) return;
  await generateNegotiationInsight(dealDraftId);
}
