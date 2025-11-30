import type { Job } from 'bullmq';
import prisma from '../../lib/prisma.js';
import { assembleContractData, draftAndAnalyzeContract } from '../../services/ai/aiContractWriter.js';
import { generatePdf } from '../../services/pdf/pdfContract.js';

/**
 * Worker to run the full AI contract generation pipeline.
 */
export default async function contractWriterProcessor(job: Job<{ dealDraftId: string }>) {
  const { dealDraftId } = job.data;
  console.log(`[WORKER] Running contract writer for deal draft: ${dealDraftId}`);

  // 1. Assemble Data
  const dealDraft = await prisma.dealDraft.findUnique({
    where: { id: dealDraftId },
    include: { user: true },
  });
  if (!dealDraft) throw new Error('Deal draft not found.');
  const context = await assembleContractData(dealDraft);

  // 2. Draft Contract & Analyze
  const analysis = await draftAndAnalyzeContract(context) as any;

  // 3. Generate PDF
  const pdfUrl = await generatePdf(analysis.contractText);

  // 4. Store Contract
  const contractData = {
    dealDraftId,
    userId: dealDraft.userId,
    brandName: dealDraft.brand!,
    contractText: analysis.contractText,
    termsJson: context, // Simplified
    risksJson: analysis.risks,
    redlinesJson: analysis.redlines,
    pdfUrl,
    status: 'draft',
  };

  const generatedContract = await prisma.contractGenerated.upsert({
    where: { dealDraftId },
    create: contractData,
    update: contractData,
  });

  // 5. Create placeholder SignatureRequest
  await prisma.signatureRequest.create({
    data: {
      contractId: 'placeholder_contract_id', // This needs a real Contract record
      provider: 'docusign',
      status: 'draft',
      signerEmail: 'placeholder@brand.com',
    },
  });
}