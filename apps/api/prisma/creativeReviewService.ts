import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Simulates an AI generating a quick review of a creative asset.
 * @param content The content of the asset to review.
 * @returns A string summary of the AI's findings.
 */
export const generateAIReview = async (content: any): Promise<string> => {
  // Mock AI analysis
  const issues = [];
  if (content?.captions?.short?.length > 150) {
    issues.push('The short caption is too long for some platforms.');
  }
  if (!content?.captions?.long?.includes('#ad')) {
    issues.push('The long caption is missing the required #ad disclosure.');
  }

  if (issues.length === 0) {
    return 'AI analysis complete. No major issues detected. The content aligns with brand tone and guidelines.';
  }
  return `AI analysis detected potential issues: ${issues.join(' ')}`;
};

/**
 * Creates a formal request for review for a creative asset.
 * @param assetId The ID of the asset (e.g., AssetGeneration ID).
 * @param assetType The model name of the asset.
 * @param version The version number being submitted.
 * @param requesterId The ID of the user requesting the review.
 * @returns The newly created CreativeReview record.
 */
export const requestReview = async (assetId: string, assetType: string, version: number, requesterId: string) => {
  // Fetch the content to be reviewed for the AI summary
  const assetVersion = await prisma.creativeVersion.findUnique({
    where: { assetId_version: { assetId, version } },
  });

  if (!assetVersion) {
    throw new Error('Asset version not found.');
  }

  // 1. Generate AI Review Summary
  const aiSummary = await generateAIReview(assetVersion.content);

  // 2. Create the review record
  const review = await prisma.creativeReview.create({
    data: {
      assetId,
      assetType,
      version,
      requesterId,
      status: 'in_review',
      aiSummary,
    },
  });

  // 3. Trigger notifications (e.g., to brand or admin)
  // await emailQueue.add(...)
  // await slackClient.send(...)

  return review;
};