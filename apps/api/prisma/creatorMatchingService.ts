import { PrismaClient, BrandBrief, User } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Simulates a complex AI matching engine to find and score creators for a brief.
 * @param brief The campaign brief to match against.
 * @returns An array of scored creator matches.
 */
export const generateMatchesForBrief = async (brief: BrandBrief) => {
  // 1. Get a pool of potential creators
  const creators = await prisma.user.findMany({
    where: {
      // Filter for active creators in relevant categories
      include_in_roster: true,
      ugc_categories: { hasSome: brief.categories },
    },
    include: {
      talent: true, // Ensure we can link to the Talent model
    },
  });

  const matches = [];

  for (const creator of creators) {
    if (!creator.talent) continue; // Skip users who are not talent

    // 2. Simulate scoring based on multiple factors
    const nicheMatch = (creator.ugc_categories.filter(c => brief.categories.includes(c)).length / brief.categories.length) * 100;
    const performanceHistory = Math.random() * 30 + 60; // Mock score
    const priceFit = 100 - (Math.abs((brief.budgetMax || 5000) - 2000) / 5000) * 100; // Mock
    const brandAffinity = Math.random() * 30 + 50; // Mock score

    // 3. Calculate final weighted score
    const fitScore = (nicheMatch * 0.4) + (performanceHistory * 0.3) + (priceFit * 0.2) + (brandAffinity * 0.1);

    if (fitScore > 60) { // Only include reasonably good matches
      matches.push({
        userId: creator.id,
        briefId: brief.id,
        talentId: creator.talent.id,
        fitScore: parseFloat(fitScore.toFixed(2)),
        predictedFee: Math.floor(priceFit * 50),
        predictedViews: Math.floor(performanceHistory * 1000),
        predictedEngagement: parseFloat((Math.random() * 3 + 2).toFixed(2)),
        reasoning: {
          niche: `Strong alignment in ${brief.categories[0]}.`,
          performance: 'Consistently high engagement on past content.',
        },
        risks: {
          capacity: 'May have limited availability due to recent campaigns.',
        },
      });
    }
  }

  // 4. Save the matches to the database
  await prisma.creatorMatchScore.createMany({
    data: matches,
    skipDuplicates: true, // Avoid re-creating matches
  });

  // 5. Return the top-ranked matches
  return matches.sort((a, b) => b.fitScore - a.fitScore);
};