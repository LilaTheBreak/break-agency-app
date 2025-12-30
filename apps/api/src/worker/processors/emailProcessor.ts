import { processEmailQueue } from "../../services/emailService.js";

// Phase 3: Fail loudly - throw errors so BullMQ can retry
export default async function emailProcessor(job: any) {
  try {
    const max = job.data?.max || 20;
    await processEmailQueue(max);
  } catch (err) {
    console.error("emailProcessor failed:", err);
    throw err; // Re-throw so BullMQ can retry
  }
}
