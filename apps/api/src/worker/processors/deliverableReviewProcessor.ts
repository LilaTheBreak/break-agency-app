import { runDeliverableReview } from '../../services/deliverableReviewService';

// Phase 3: Fail loudly - throw errors so BullMQ can retry
export default async function deliverableReviewProcessor(job: any) {
  const { deliverableId, content, userId } = job.data ?? {};
  if (!deliverableId || !content) {
    throw new Error(`deliverableReviewProcessor: missing deliverableId or content in job data. Job data: ${JSON.stringify(job.data)}`);
  }
  await runDeliverableReview({ deliverableId, content, userId });
}
