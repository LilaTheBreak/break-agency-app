import { processContractReview } from '../../services/aiAgent/contractRunner';

// Phase 3: Fail loudly - throw errors so BullMQ can retry
export default async function contractProcessor(job: any) {
  try {
    return await processContractReview(job.data);
  } catch (err) {
    console.error("contractProcessor failed:", err);
    throw err; // Re-throw so BullMQ can retry
  }
}
