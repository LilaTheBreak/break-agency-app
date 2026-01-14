import { performOutreachTask } from '../../services/aiAgent/outreachRunner';

// Phase 3: Fail loudly - throw errors so BullMQ can retry
export default async function outreachProcessor(job: any) {
  try {
    await performOutreachTask(job.data);
  } catch (err) {
    console.error("outreachProcessor failed:", err);
    throw err; // Re-throw so BullMQ can retry
  }
}
