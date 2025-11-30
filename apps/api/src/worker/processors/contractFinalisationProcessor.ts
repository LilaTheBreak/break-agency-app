import { generateContract } from "../../services/contractGenerationService.js";

export default async function contractFinalisationProcessor(job: any) {
  const { userId, dealId, threadId, terms } = job.data ?? {};
  if (!userId || !terms) return;
  return generateContract(userId, dealId ?? null, threadId ?? null, terms);
}
