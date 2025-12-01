import { PrismaClient } from '@prisma/client';
import { extractTextFromPdf } from './pdfExtractor';
import { cleanContractText } from './contractCleaner';
import { detectContractRisks } from './contractRiskDetector';
import { generateRedlines } from './contractRedlineGenerator';
// import { generateNegotiationDrafts } from './contractNegotiationDrafts';

const prisma = new PrismaClient();

/**
 * Main orchestrator for the contract review pipeline.
 * @param contractReviewId The ID of the contract review to process.
 * @param pdfBuffer The buffer of the uploaded PDF file.
 */
export const runContractReviewEngine = async (contractReviewId: string, pdfBuffer: Buffer) => {
  try {
    // 1. Extract Text
    await prisma.contractReview.update({ where: { id: contractReviewId }, data: { status: 'extracting_text' } });
    const rawText = await extractTextFromPdf(pdfBuffer);

    // 2. Clean Text
    await prisma.contractReview.update({ where: { id: contractReviewId }, data: { status: 'cleaning_text', extractText: rawText } });
    const cleanedText = await cleanContractText(rawText);

    // 3. Detect Risks
    await prisma.contractReview.update({ where: { id: contractReviewId }, data: { status: 'detecting_risks', cleanedText } });
    const { risks, dangerousClauses, missingClauses } = await detectContractRisks(cleanedText);

    // 4. Generate Redlines
    await prisma.contractReview.update({
      where: { id: contractReviewId },
      data: { status: 'generating_redlines', risks, dangerousClauses, missingClauses },
    });
    const redlines = await generateRedlines(risks, cleanedText);

    // 5. Generate Negotiation Drafts (stubbed)
    // const negotiationDrafts = await generateNegotiationDrafts(redlines);

    // 6. Final Update
    await prisma.contractReview.update({
      where: { id: contractReviewId },
      data: {
        status: 'completed',
        redlines,
        // negotiationDrafts,
      },
    });

    console.log(`Contract review ${contractReviewId} completed successfully.`);
  } catch (error) {
    console.error(`Error in contract review engine for ID ${contractReviewId}:`, error);
    await prisma.contractReview.update({ where: { id: contractReviewId }, data: { status: 'failed' } });
  }
};