import { Router } from 'express';
import { signatureWebhookQueue } from '../worker/queues/signatureQueue.js';

const router = Router();

/**
 * POST /api/signature/webhook
 * The endpoint for DocuSign (or other providers) to send status updates.
 */
router.post('/webhook', async (req, res) => {
  const event = req.body;
  console.log('[WEBHOOK] Received signature event:', event);
  await signatureWebhookQueue.add('docusign-webhook', { event: event.event, payload: event });
  res.sendStatus(200);
});

export default router;