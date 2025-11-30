import prisma from '../../lib/prisma.js';
import { docusignClient } from '../../integrations/signature/docusignClient.js';
import { signatureNotifyQueue } from '../../worker/queues/signatureQueue.js';

/**
 * Prepares and sends a contract for signature via DocuSign.
 * @param contractReviewId - The ID of the reviewed contract.
 */
export async function sendForSignature(contractReviewId: string) {
  // 1. Load contract and deal context
  const review = await prisma.contractReview.findUnique({
    where: { id: contractReviewId },
    include: { user: true },
  });
  // This assumes a link from ContractReview back to DealDraft/Thread
  const dealDraft = await prisma.dealDraft.findFirst({ where: { id: 'some_deal_draft_id' } });

  if (!review || !review.user || !dealDraft) {
    throw new Error('Cannot send for signature: Missing contract, user, or deal context.');
  }

  // 2. Create the envelope payload for DocuSign
  const envelopePayload = {
    emailSubject: `Your Agreement with ${review.user.name}`,
    documents: [{ documentBase64: '...', name: `${review.brandName} Agreement.pdf` }], // Base64 of PDF from S3
    recipients: {
      signers: [
        { email: review.user.email, name: review.user.name, recipientId: '1', roleName: 'Creator' },
        { email: dealDraft.brandEmail, name: dealDraft.brand, recipientId: '2', roleName: 'Brand' },
      ],
    },
    status: 'sent',
  };

  // 3. Send the envelope via the client
  const { envelopeId, status } = await docusignClient.sendEnvelope(envelopePayload);

  // 4. Save the SignatureRequest record
  const signatureRequest = await prisma.signatureRequest.create({
    data: {
      contractId: review.id, // Assuming ContractReview ID is used as the contractId
      provider: 'docusign',
      status,
      envelopeId,
      signerEmail: `${review.user.email}, ${dealDraft.brandEmail}`,
      signerName: `${review.user.name}, ${dealDraft.brand}`,
    },
  });

  console.log(`[SIGNATURE SERVICE] Envelope ${envelopeId} sent for contract ${contractReviewId}.`);
  return signatureRequest;
}

/**
 * Handles incoming webhook events from the signature provider.
 * @param event - The webhook event payload.
 */
export async function handleWebhookEvent(event: { envelopeId: string; status: string }) {
  console.log(`[SIGNATURE SERVICE] Handling webhook for envelope ${event.envelopeId} with status: ${event.status}`);

  const request = await prisma.signatureRequest.findFirst({ where: { envelopeId: event.envelopeId } });
  if (!request) {
    console.error(`Could not find SignatureRequest for envelope ${event.envelopeId}`);
    return;
  }

  // Update the status of the request
  await prisma.signatureRequest.update({ where: { id: request.id }, data: { status: event.status } });

  // If the contract is now fully signed and completed
  if (event.status === 'completed') {
    // 1. Download the signed PDF
    const pdfBuffer = await docusignClient.downloadSignedPDF(event.envelopeId);

    // 2. Save to S3 via fileService (stubbed)
    const signedPdfUrl = `https://stub-s3.local/signed/signed-contract-${request.id}.pdf`;
    console.log(`[SIGNATURE SERVICE] "Uploaded" signed PDF to ${signedPdfUrl}`);

    // 3. Update ContractReview and DealThread
    await prisma.contractReview.update({ where: { id: request.contractId }, data: { status: 'executed', signedPdfUrl } });
    const dealThread = await prisma.dealThread.findFirst({ where: { dealDraft: { id: 'some_deal_draft_id' } } });
    if (dealThread) {
      await prisma.dealThread.update({ where: { id: dealThread.id }, data: { stage: 'CLOSED_WON' } });
      // Optionally close the negotiation thread
      await prisma.negotiationThread.updateMany({ where: { dealId: dealThread.id }, data: { status: 'closed' } });
    }

    // 4. Notify relevant parties
    await signatureNotifyQueue.add('notify-signed', { contractId: request.contractId });
  }
}