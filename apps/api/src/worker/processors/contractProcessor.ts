import { processContractReview } from "../../services/aiAgent/contractRunner.js";

export default async function contractProcessor(job: any) {
  return processContractReview(job.data);
}
