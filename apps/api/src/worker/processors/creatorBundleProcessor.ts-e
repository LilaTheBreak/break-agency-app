import { generateCreatorBundle } from '../../services/creatorBundleService';

// Phase 3: Fail loudly - throw errors so BullMQ can retry
export default async function creatorBundleProcessor(job: any) {
  try {
    return await generateCreatorBundle(job.data);
  } catch (err) {
    console.error("creatorBundleProcessor failed:", err);
    throw err; // Re-throw so BullMQ can retry
  }
}
