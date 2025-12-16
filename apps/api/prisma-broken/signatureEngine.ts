import { PrismaClient } from '@prisma/client';
import { embedSignatureInPdf } from './pdfBuilder';
import { logSignatureAuditEvent } from './auditLogger';
// import { fileService } from '../fileService'; // Assume S3 file service
// import { emailQueue } from '../../worker/queues';

const prisma = new PrismaClient();

/**
 * Main service to handle the document signing process.
 * @param signatureRequestId The ID of the signature request.
 * @param signatureDataUrl The base64 data URL of the signature image.
 * @param ipAddress The IP address of the signer.
 * @returns The updated SignatureRequest object.
 */
export const signDocument = async (
  signatureRequestId: string,
  signatureDataUrl: string,
  ipAddress: string
) => {
  const request = await prisma.signatureRequest.findUnique({
    where: { id: signatureRequestId },
    include: { contract: true },
  });

  if (!request || !request.contract) {
    throw new Error('Signature request or associated contract not found.');
  }

  // 1. Convert data URL to buffer
  const signaturePngBuffer = Buffer.from(signatureDataUrl.split(',')[1], 'base64');

  // 2. Get original document from S3 (mocked)
  // const originalPdfBuffer = await fileService.download(request.contract.pdfUrl);
  const originalPdfBuffer = Buffer.from(''); // Placeholder

  // 3. Embed signature into PDF
  const signedPdfBuffer = await embedSignatureInPdf(originalPdfBuffer, signaturePngBuffer, 100, 100); // Example coordinates

  // 4. Upload signed PDF to S3 (mocked)
  // const { url: signedPdfUrl } = await fileService.upload(signedPdfBuffer, `signed/${request.id}.pdf`);
  const signedPdfUrl = `s3-placeholder-url/signed/${request.id}.pdf`;

  // 5. Update database record
  const updatedRequest = await prisma.signatureRequest.update({
    where: { id: signatureRequestId },
    data: {
      status: 'signed',
      signedAt: new Date(),
      signedPdfUrl,
      ipAddress,
    },
  });

  // 6. Log the signing event
  await logSignatureAuditEvent(signatureRequestId, 'signed', { ipAddress });

  // 7. Enqueue post-signing notifications
  // await emailQueue.add('notify-parties-signed', { contractId: request.contractId });

  return updatedRequest;
};