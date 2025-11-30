import { performNegotiationTask } from "../../services/aiAgent/negotiationRunner.js";

export default async function negotiationSessionProcessor(job: any) {
  await performNegotiationTask(job.data);
}
