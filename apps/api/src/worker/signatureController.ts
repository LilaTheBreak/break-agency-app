import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { signDocument } from '../../services/signature/signatureEngine.js';
import { logSignatureAuditEvent } from '../../services/signature/auditLogger.js';

const prisma = new PrismaClient();

// @desc    Create a signature request for a contract
// @route   POST /api/contracts/:id/signature/create
export const createSignatureRequest = asyncHandler(async (req: Request, res: Response) => {
  const { signerEmail, signerName } = req.body;
  const contractId = req.params.id;

  const request = await prisma.signatureRequest.create({
    data: {
      contractId,
      signerEmail,
      signerName,
      provider: 'native', // Using our internal system
    },
  });

  await logSignatureAuditEvent(request.id, 'created');
  // Enqueue email to be sent to signer
  // await signatureQueue.add('send-signature-request', { requestId: request.id });

  res.status(201).json(request);
});

// @desc    Get a signature request for signing
// @route   GET /api/signature/:id
export const getSignatureRequest = asyncHandler(async (req: Request, res: Response) => {
  const request = await prisma.signatureRequest.findUnique({
    where: { id: req.params.id },
    include: { contract: true },
  });

  if (!request) {
    res.status(404);
    throw new Error('Signature request not found.');
  }

  await logSignatureAuditEvent(request.id, 'viewed', { ip: req.ip });
  res.status(200).json(request);
});

// @desc    Sign a document
// @route   POST /api/signature/:id/sign
export const submitSignature = asyncHandler(async (req: Request, res: Response) => {
  const { signatureDataUrl } = req.body;
  const ipAddress = req.ip;

  const updatedRequest = await signDocument(req.params.id, signatureDataUrl, ipAddress);

  res.status(200).json(updatedRequest);
});

// @desc    Download a signed document
// @route   GET /api/signature/:id/download
export const downloadSignedDocument = asyncHandler(async (req: Request, res: Response) => {
  const request = await prisma.signatureRequest.findUnique({ where: { id: req.params.id } });
  if (!request?.signedPdfUrl) {
    res.status(404);
    throw new Error('Signed document not found or not yet available.');
  }
  // In a real app, this would generate a secure, short-lived S3 URL
  res.redirect(request.signedPdfUrl);
});