import { ingestGmailForUser } from '../../services/gmail/gmailService.js';

// Phase 3: Fail loudly - throw errors so BullMQ can retry
export default async function gmailIngestProcessor(job: any) {
  const userId = job.data?.userId;
  if (!userId) {
    throw new Error("gmailIngestProcessor: missing userId in job data");
  }
  await ingestGmailForUser(userId);
}
