import { runEmailTriage } from "../../services/aiTriageService.js";

export default async function triageProcessor(job: any) {
  const emailId = job.data?.emailId;
  if (!emailId) return;
  await runEmailTriage(emailId);
}
