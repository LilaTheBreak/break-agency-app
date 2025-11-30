import prisma from '../../lib/prisma.js';

/**
 * Creates a new version of a contract review, archiving the current state.
 * @param contractReviewId - The ID of the contract review to version.
 * @param changes - A description of the changes made in this version.
 * @param actor - Who made the changes ('ai' or 'user').
 */
export async function createNewContractVersion(contractReviewId: string, changes: any, actor: string) {
  const currentReview = await prisma.contractReview.findUnique({ where: { id: contractReviewId }, include: { terms: true } });
  if (!currentReview) throw new Error('Contract review not found.');

  const currentVersionNumber = (await prisma.contractReviewVersion.count({ where: { contractReviewId } })) || 0;

  // Create the new version record
  const newVersion = await prisma.contractReviewVersion.create({
    data: {
      contractReviewId,
      version: currentVersionNumber + 1,
      rawText: currentReview.rawText,
      aiSummary: currentReview.aiSummary,
      aiRisks: currentReview.aiRisks,
      aiRedlines: currentReview.aiRedlines,
    },
  });

  // Log the change in history
  await prisma.redlineHistory.create({
    data: { contractReviewId, actor, changes, versionBefore: currentVersionNumber, versionAfter: newVersion.version },
  });

  return newVersion;
}