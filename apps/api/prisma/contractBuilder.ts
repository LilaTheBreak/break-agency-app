import prisma from '../../lib/prisma.js';
import { generateContract } from './aiContractGenerator.js';
import { generatePdf } from '../pdf/pdfContract.js'; // Assuming this exists from S68

/**
 * The main orchestrator for the AI contract generation pipeline.
 * @param threadId - The ID of the finalized NegotiationThread.
 */
export async function buildContractForDeal(threadId: string) {
  // 1. Load Negotiation State
  const thread = await prisma.negotiationThread.findUnique({
    where: { id: threadId },
    include: {
      user: { include: { agentPolicy: true } },
      dealDraft: true,
      messages: { orderBy: { createdAt: 'desc' }, take: 5 },
    },
  });

  if (!thread || !thread.user || !thread.dealDraft) {
    throw new Error('Required negotiation state for contract generation is missing.');
  }

  // 2. Build Contract Prompt Context
  const context = {
    brandName: thread.brandName,
    creatorName: thread.user.name,
    finalRate: thread.finalRate,
    deliverables: thread.dealDraft.deliverables,
    negotiationSummary: thread.messages.map(m => m.body).join('\n'),
  };

  // 3. Generate Contract with AI
  const result = await generateContract(context) as any;

  // 4. Save ContractReview record
  const review = await prisma.contractReview.create({
    data: {
      userId: thread.userId!,
      brandName: thread.brandName,
      rawText: result.fullContractText,
      aiSummary: { summary: result.summary },
      aiRisks: result.risks,
      aiRedlines: result.redlines,
      status: 'ai_drafted',
    },
  });

  // 5. Save ContractTerm[] records
  if (result.terms && result.terms.length > 0) {
    await prisma.contractTerm.createMany({
      data: result.terms.map((term: any) => ({
        contractId: review.id,
        label: term.term,
        value: term.value,
        category: term.term, // Simplified category
      })),
    });
  }

  // 6. Build and Upload PDF (if not in sandbox mode)
  if (!thread.user.agentPolicy?.sandboxMode) {
    const pdfUrl = await generatePdf(result.fullContractText);
    // This assumes a generic File model for S3 uploads
    const fileRecord = await prisma.file.create({
      data: { userId: thread.userId, url: pdfUrl, filename: `${thread.brandName} Agreement.pdf`, folder: 'contracts' },
    });
    await prisma.contractReview.update({
      where: { id: review.id },
      data: { fileId: fileRecord.id },
    });
  }

  console.log(`[CONTRACT BUILDER] Successfully generated contract for thread ${threadId}. Review ID: ${review.id}`);
  return review;
}