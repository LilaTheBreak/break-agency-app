import { PrismaClient, BrandBrief } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Generates various creator bundles for a given campaign brief.
 * @param brief The campaign brief object.
 * @returns An array of generated bundles.
 */
export const generateCreatorBundles = async (brief: BrandBrief) => {
  const matches = await prisma.creatorMatchScore.findMany({
    where: { briefId: brief.id },
    include: { user: { select: { name: true, avatarUrl: true, roster_category: true } } },
    orderBy: { fitScore: 'desc' },
  });

  if (matches.length === 0) {
    return [];
  }

  // --- Bundle Generation Logic ---

  // 1. Performance Bundle: Highest predicted views/engagement
  const performanceCreators = [...matches]
    .sort((a, b) => (b.predictedViews || 0) - (a.predictedViews || 0))
    .slice(0, 3);

  const performanceBundle = {
    userId: brief.userId,
    briefId: brief.id,
    type: 'Performance',
    creators: performanceCreators,
    budget: { estimated: performanceCreators.reduce((sum, c) => sum + (c.predictedFee || 0), 0) },
    forecast: { predictedViews: performanceCreators.reduce((sum, c) => sum + (c.predictedViews || 0), 0) },
    aiSummary: 'This bundle is optimized for maximum reach and views, featuring creators with a proven track record of high-performing content.',
  };

  // 2. Brand Fit Bundle: Highest fit score
  const brandFitCreators = [...matches]
    .sort((a, b) => b.fitScore - a.fitScore)
    .slice(0, 3);

  const brandFitBundle = {
    userId: brief.userId,
    briefId: brief.id,
    type: 'Brand Fit',
    creators: brandFitCreators,
    budget: { estimated: brandFitCreators.reduce((sum, c) => sum + (c.predictedFee || 0), 0) },
    forecast: { predictedEngagement: 4.5 },
    aiSummary: 'This bundle focuses on creators whose audience and content style perfectly align with your brand, maximizing authenticity and engagement.',
  };

  // 3. Premium (Exclusive) Bundle
  const premiumCreators = matches
    .filter(m => m.user.roster_category === 'EXCLUSIVE')
    .slice(0, 3);

  const premiumBundle = {
    userId: brief.userId,
    briefId: brief.id,
    type: 'Premium',
    creators: premiumCreators,
    budget: { estimated: premiumCreators.reduce((sum, c) => sum + (c.predictedFee || 0), 0) * 1.2 }, // Premium talent may have higher fees
    forecast: { predictedROI: 3.5 },
    aiSummary: 'This bundle features top-tier, exclusive talent managed by The Break, ensuring professional execution and premium content quality.',
  };

  const bundlesToCreate = [performanceBundle, brandFitBundle];
  if (premiumCreators.length > 0) {
    bundlesToCreate.push(premiumBundle);
  }

  // Delete old bundles for this brief before creating new ones
  await prisma.creatorBundle.deleteMany({
    where: { briefId: brief.id },
  });

  // Save new bundles to the database
  await prisma.creatorBundle.createMany({
    data: bundlesToCreate,
  });

  return await prisma.creatorBundle.findMany({
    where: { briefId: brief.id },
  });
};