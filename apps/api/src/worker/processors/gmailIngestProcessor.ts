import { ingestGmailForUser } from "../../services/gmail/gmailService.js";

export default async function gmailIngestProcessor(job: any) {
  const userId = job.data?.userId;
  if (!userId) return;
  await ingestGmailForUser(userId);
}
