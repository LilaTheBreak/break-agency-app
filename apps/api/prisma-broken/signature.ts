import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { signaturePrepareQueue } from '../worker/queues/signatureQueues.js';
import { validateSigningToken } from '../services/signature/signatureLinkService.js';
import { finalizeSignature } from '../services/signature/signatureService.js';

const router = Router();

/**
 * POST /api/contracts/:id/signature/create
 * Triggers the signature request creation pipeline.
 */
router.post('/contracts/:id/signature/create', async (req, res) => {
  const { id } = req.params;
  const { signers } = req.body; // e.g., [{ email, name, type }]
  await signaturePrepareQueue.add('create-signature-request', { contractId: id, signers });
  res.status(202).json({ message: 'Signature request creation has been queued.' });
});

/**
 * GET /api/signature/:token
 * Validates a signing token and returns the request details.
 */
router.get('/:token', async (req, res) => {
  const payload = validateSigningToken(req.params.token);
  if (!payload) {
    return res.status(401).json({ error: 'Invalid or expired signing link.' });
  }
  const request = await prisma.signatureRequest.findUnique({ where: { id: payload.requestId } });
  res.json({ request, signerEmail: payload.signerEmail });
});

/**
 * POST /api/signature/:requestId/sign
 * Submits a signature for a specific request.
 */
router.post('/:requestId/sign', async (req, res, next) => {
  const { requestId } = req.params;
  const { signerEmail, signatureImageBase64 } = req.body;
  try {
    await finalizeSignature(requestId, signerEmail, signatureImageBase64);
    res.json({ message: 'Signature submitted successfully.' });
  } catch (error) {
    next(error);
  }
});

export default router;