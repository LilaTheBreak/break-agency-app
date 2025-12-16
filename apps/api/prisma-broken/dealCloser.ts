import prisma from '../../lib/prisma.js';
import { aiClient } from './aiClient.js';
import { generateContractDraft } from '../contracts/contractDraft.js';
import { generateAIRedlines } from './redlineGenerator.js';
import { createContractPdf } from '../contracts/pdfGenerator.js';
import { sendForSignature } from '../../integrations/signature/docusignClient.js';

async function summarizeThread(threadId: string) {
  const turns = await prisma.negotiationTurn.findMany({ where: { threadId }, orderBy: { createdAt: 'asc' } });
  const prompt = `
    You are a commercial negotiation summarizer. Read the following negotiation conversation and extract the final agreed-upon terms.
    Conversation:
    ${JSON.stringify(turns.map(t => ({ actor: t.actor, body: t.body })), null, 2)}

    Extract the final agreed deliverables, budget, usage terms, exclusivity, and deadlines.
    Respond with a JSON object.
  `;
  return aiClient.json(prompt);
}

/**
 * The main orchestrator function for closing a deal.
 * @param threadId - The ID of the negotiation thread to close.
 */
export async function runDealCloser(threadId: string) {
  const thread = await prisma.negotiationThread.findUnique({ where: { id: threadId }, include: { user: { include: { agentPolicy: true } } } });
  if (!thread) throw new Error('Thread not found');

  const policy = thread.user.agentPolicy;

  // 1. Summarize final agreed points
  const summary = await summarizeThread(threadId);
  await prisma.negotiationSession.updateMany({ where: { threadId: thread.id }, data: { aiNotes: summary } });

  // 2. Generate Final Offer Package (using summary)
  const finalOffer = {
    finalRate: (summary as any).budget,
    deliverables: (summary as any).deliverables,
    // ... and so on
  };

  // 3. Create contract draft (JSON Terms)
  const contractJson = await generateContractDraft(finalOffer);
  const contractReview = await prisma.contractReview.create({
    data: {
      userId: thread.userId,
      brandName: thread.brandName,
      aiDealMapping: contractJson,
    },
  });

  // 4. Generate AI redlines
  const redlines = await generateAIRedlines(contractJson);
  await prisma.contractReview.update({ where: { id: contractReview.id }, data: { aiRedlines: redlines } });

  // Check policy before proceeding
  if (policy?.sandboxMode || !policy?.autoSendContracts) {
    console.log(`[DEAL CLOSER] Sandbox mode or auto-send disabled. Halting before sending contract for thread ${threadId}.`);
    return { status: 'drafted', message: 'Contract drafted and redlined. Manual review required.' };
  }

  // 5. Produce contract PDF
  const { pdfUrl, s3Key } = await createContractPdf(contractJson);

  // 6. Send to signature
  const signatureResult = await sendForSignature({
    pdfUrl,
    signerEmail: thread.brandEmail,
    signerName: thread.brandName || 'Client',
  });

  // 7. Update DealThread + Contract models
  await prisma.contract.create({
    data: {
      userId: thread.userId,
      threadId: thread.id,
      status: 'out_for_signature',
      pdfUrl,
      signatureRequests: {
        create: {
          provider: 'docusign',
          status: signatureResult.status,
          envelopeId: signatureResult.envelopeId,
          signerEmail: thread.brandEmail,
          signerName: thread.brandName || 'Client',
        },
      },
    },
  });

  await prisma.dealThread.update({ where: { id: threadId }, data: { stage: 'PENDING_CONTRACT' } });

  return { status: 'sent', envelopeId: signatureResult.envelopeId };
}