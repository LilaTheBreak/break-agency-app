import prisma from '../../lib/prisma.js';

// Note: brandCampaignPrediction and opportunityCluster models don't exist in schema
export async function buildOpportunityClusters(userId: string) {
  console.warn("Opportunity clustering not yet implemented - models do not exist");
  return [];
  
  // Original implementation (commented out - models don't exist):
  /*
  const preds = await prisma.brandCampaignPrediction.findMany({
    where: { userId, likelihood: { gt: 40 } }
  });

  const clusters: Record<string, any[]> = {};

  for (const p of preds) {
    const category = (p.reasons as any)?.category || "Uncategorised";
    if (!clusters[category]) clusters[category] = [];
    clusters[category].push(p);
  }

  const result = [];

  for (const [category, items] of Object.entries(clusters)) {
    const avgLikelihood = items.reduce((a, c) => a + c.likelihood, 0) / items.length;
    result.push(
      await prisma.opportunityCluster.create({
        data: {
          userId,
          category,
          brands: items,
          score: Math.floor(avgLikelihood),
          insights: {
            count: items.length,
            avgLikelihood
          }
        }
      })
    );
  }

  return result;
  */
}
