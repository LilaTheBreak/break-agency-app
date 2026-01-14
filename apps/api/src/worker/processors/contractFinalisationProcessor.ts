import { generateContract } from '../../services/contractGenerationService.js';

// Phase 3: Fail loudly - throw errors so BullMQ can retry
export default async function contractFinalisationProcessor(job: any) {
  const { userId, dealId, threadId, terms } = job.data ?? {};
  if (!userId || !terms) {
    throw new Error(`contractFinalisationProcessor: missing userId or terms in job data. Job data: ${JSON.stringify(job.data)}`);
  }
  return generateContract(userId, dealId ?? null, threadId ?? null, terms);
}
