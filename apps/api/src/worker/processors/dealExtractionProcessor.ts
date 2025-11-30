import { extractDealFromEmail } from "../../services/dealExtractionService.js";

export default async function dealExtractionProcessor(job: any) {
  const emailId = job.data?.emailId;
  if (!emailId) return;
  await extractDealFromEmail(emailId);
}
