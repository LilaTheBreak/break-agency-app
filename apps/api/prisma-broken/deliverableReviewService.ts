import { PrismaClient, Deliverable, BrandCampaign } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Simulates a full AI review of a submitted deliverable.
 * @param deliverable The deliverable to be reviewed.
 * @param campaign The campaign associated with the deliverable.
 * @returns The ID of the newly created DeliverableReview record.
 */
export const runDeliverableReview = async (deliverable: Deliverable, campaign: BrandCampaign) => {
  console.log(`Running AI review for deliverable: ${deliverable.id}`);

  // 1. Fetch the creative direction for alignment checking
  const creativeDirection = await prisma.creativeDirection.findUnique({
    where: { campaignId: campaign.id },
  });

  // 2. Mock AI Analysis
  const aiSummary = `The submitted content successfully captures the '${creativeDirection?.tone?.keywords[0]}' tone. The hook is strong, but the call-to-action could be clearer.`;

  const aiIssues = [
    { type: 'Clarity', message: 'The primary call-to-action is not clearly stated within the first 15 seconds.' },
    { type: 'Pacing', message: 'The video pacing slows down around the 20-second mark, which may impact retention.' },
  ];

  const aiSuggestions = [
    'Try adding a text overlay with the CTA: "Link in Bio!" at the 10-second mark.',
    'Consider cutting 2-3 seconds from the middle section to maintain momentum.',
  ];

  const riskFlags = {
    asa: 'low',
    music: 'none', // Assuming no copyrighted music detected
    competitor: 'none',
    tone: 'low',
    safety: 'none',
  };

  // Mock alignment score calculation
  const alignment = {
    conceptScore: 90,
    toneScore: 85,
    paletteScore: 95,
    overall: 90,
  };

  const aiScore = Math.round((alignment.overall + (100 - (aiIssues.length * 10))) / 2);

  // 3. Upsert the DeliverableReview record
  const review = await prisma.deliverableReview.upsert({
    where: { deliverableId: deliverable.id },
    create: {
      deliverableId: deliverable.id,
      aiSummary,
      aiIssues,
      aiSuggestions,
      aiScore,
      riskFlags,
      alignment,
      status: 'pending',
    },
    update: { aiSummary, aiIssues, aiSuggestions, aiScore, riskFlags, alignment, status: 'pending' },
  });

  return review.id;
};