import type { Job } from 'bullmq';
import { sendEmailFromOutbox } from '../../services/email/emailSender.js';

/**
 * Worker to process and send an email from the outbox.
 */
export default async function emailProcessor(job: Job<{ emailOutboxId: string }>) {
  const { emailOutboxId } = job.data;
  console.log(`[WORKER] Processing email job for outbox ID: ${emailOutboxId}`);
  await sendEmailFromOutbox(emailOutboxId).catch(err => {
    console.error(`[WORKER ERROR] Email sending failed for outbox ID ${emailOutboxId}:`, err);
    throw err;
  });
}