import type { Job } from 'bullmq';
import { generateAutoReply } from '../../agent/inbox/autoReplyEngine.js';

/**
 * Worker to run the AI auto-reply pipeline for an email.
 */
export default async function autoReplyProcessor(job: Job<{ emailId: string }>) {
  const { emailId } = job.data;
  console.log(`[WORKER] Generating auto-reply for email: ${emailId}`);
  await generateAutoReply(emailId).catch(err => {
    console.error(`[WORKER ERROR] Auto-reply failed for email ${emailId}:`, err);
    throw err;
  });
}