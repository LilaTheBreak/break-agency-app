import { performNegotiationTask } from '../../services/aiAgent/negotiationRunner.js';

// Phase 3: Fail loudly - throw errors so BullMQ can retry
export default async function negotiationSessionProcessor(job: any) {
  try {
    await performNegotiationTask(job.data);
  } catch (err) {
    console.error("negotiationSessionProcessor failed:", err);
    throw err; // Re-throw so BullMQ can retry
  }
}
