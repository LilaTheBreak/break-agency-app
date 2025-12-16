import type { Job } from 'bullmq';
import { sendForSignature, handleWebhookEvent } from '../../services/signature/signatureService.js';

/**
 * Worker to run the signature pipeline and handle webhooks.
 */
export default async function signatureProcessor(job: Job<any>) {
  console.log(`[WORKER] Running signature job: ${job.name}`);

  switch (job.name) {
    case 'send-for-signature':
      await sendForSignature(job.data.contractReviewId);
      break;
    case 'docusign-webhook':
      await handleWebhookEvent(job.data.payload);
      break;
    // Add other cases for notifications, polling, etc.
    default:
      console.warn(`[WORKER] Unknown signature job name: ${job.name}`);
  }
}