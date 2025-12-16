import prisma from '../../lib/prisma.js';

/**
 * Creates a `ContractReview` and associated `ContractTerm` records from a generated SOW.
 * @param sow - The Statement of Work object.
 * @param context - Additional context like userId and brandName.
 * @returns The newly created ContractReview record.
 */
export async function draftContractFromSOW(sow: any, context: { userId: string; brandName: string }) {
  console.log('[CONTRACT DRAFT] Generating contract records from SOW...');

  const contractReview = await prisma.contractReview.create({
    data: {
      userId: context.userId,
      brandName: context.brandName,
      status: 'ai_drafted',
      aiDealMapping: sow, // Store the full SOW as the deal mapping
      terms: {
        create: Object.entries(sow.commercials).map(([key, value]) => ({
          category: 'Commercials',
          label: key,
          value: String(value),
        })),
      },
    },
  });

  return contractReview;
}