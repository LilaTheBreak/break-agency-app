import { runDeliverableReview } from "../../services/deliverableReviewService.js";

export default async function deliverableReviewProcessor(job: any) {
  const { deliverableId, content, userId } = job.data ?? {};
  if (!deliverableId || !content) return;
  await runDeliverableReview({ deliverableId, content, userId });
}
