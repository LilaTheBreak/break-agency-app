import prisma from '../../lib/prisma.js';
import { forecastKPIs } from './kpiForecast.js';

/**
 * Orchestrates the budget optimization process for a campaign plan.
 * @param aiPlanId - The ID of the CampaignAIPlan.
 */
export async function runBudgetOptimizer(aiPlanId: string) {
  // 1. Load plan and top-matched talent
  const plan = await prisma.campaignAIPlan.findUnique({ where: { id: aiPlanId } });
  const matches = await prisma.creatorMatchResult.findMany({
    where: { aiPlanId },
    orderBy: { rank: 'asc' },
    take: 3, // Consider the top 3 matched talents
    include: { talent: { include: { user: { include: { socialAnalytics: true } } } } },
  });

  if (!plan || !plan.budget) throw new Error('Plan or budget not found.');
  if (matches.length === 0) throw new Error('No matched creators found for this plan.');

  const totalBudget = (plan.budget as any).total || 20000;
  let allocatedBudget = 0;
  const breakdown: any[] = [];
  const forecast = { totalViews: 0, totalEngagements: 0 };

  // 2. Allocate budget across talent (simplified greedy approach)
  for (const match of matches) {
    if (allocatedBudget >= totalBudget) break;

    const fee = match.predictedFee || 5000;
    if (allocatedBudget + fee > totalBudget) continue;

    // 3. For each chosen talent, predict KPIs for their deliverables
    const kpis = await forecastKPIs({
      talentAnalytics: match.talent.user.socialAnalytics[0],
      deliverableType: 'IG_POST', // Simplified
    });

    breakdown.push({
      talentId: match.talentId,
      talentName: match.talent.user.name,
      allocation: fee,
      deliverables: [{ type: 'IG_POST', count: 1, predictedKPIs: kpis }],
    });

    allocatedBudget += fee;
    forecast.totalViews += kpis.predictedViews;
    forecast.totalEngagements += kpis.predictedEngagement;
  }

  // 4. Generate rationale
  const rationale = {
    strategy: 'Prioritized top-ranked creators who fit within the budget.',
    notes: `Allocated ${allocatedBudget} of ${totalBudget} across ${breakdown.length} creators.`,
  };

  // 5. Persist results to the database
  return saveOptimizedBudget({
    aiPlanId,
    totalBudget,
    allocatedBudget,
    breakdown,
    forecast,
    rationale,
  });
}

/**
 * Saves the optimized budget to the database.
 */
async function saveOptimizedBudget(data: any) {
  return prisma.aIOptimizedBudget.upsert({
    where: { aiPlanId: data.aiPlanId },
    create: data,
    update: data,
  });
}