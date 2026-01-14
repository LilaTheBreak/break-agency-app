/**
 * Founder Dependency Index Service
 * 
 * Computes founder dependency score based on:
 * - % of revenue requiring founder presence
 * - Number of SOP-less critical processes
 * - Manual operations volume
 * - Delegation coverage
 * - Team depth
 */

import prisma from '../lib/prisma.js';

export interface FounderDependencyInput {
  talentId: string;
  founderDependencyPercent: number;
  soplessProcessCount: number;
  manualOpsHoursPerWeek: number;
  delegationCoveragePercent: number;
  teamDepthScore: number;
}

export enum RiskRating {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

/**
 * Get founder dependency index for a talent
 */
export async function getFounderDependencyIndex(talentId: string) {
  try {
    let index = await prisma.founderDependencyIndex.findUnique({
      where: { talentId },
    });

    if (!index) {
      index = await computeFounderDependencyIndex(talentId);
    }

    return index;
  } catch (error) {
    console.error('Error getting founder dependency index:', error);
    throw error;
  }
}

/**
 * Compute founder dependency index from business data
 */
export async function computeFounderDependencyIndex(talentId: string) {
  try {
    // Get revenue streams and their founder dependency
    const revenueStreams = await prisma.revenueStream.findMany({
      where: { talentId, isActive: true },
    });

    // Get deal classifications
    const deals = await prisma.deal.findMany({
      where: { talentId },
      include: { RevenueClassification: true },
    });

    // Get SOP coverage
    const sopTemplates = await prisma.sOPTemplate.findMany({
      where: { ownerUserId: talentId },
    });

    // Calculate founder dependency from revenue streams
    let totalRevenue = 0;
    let founderDependentRevenue = 0;

    for (const stream of revenueStreams) {
      const revenue = Number(stream.monthlyRevenue) * 12;
      totalRevenue += revenue;
      founderDependentRevenue += revenue * (Number(stream.founderDependency) / 100);
    }

    const founderDepPercent = totalRevenue > 0 ? (founderDependentRevenue / totalRevenue) * 100 : 0;

    // Count SOP-less processes (estimated from deals without SOPs)
    const dealsWithoutSOPs = deals.filter(
      (deal) => !deal.RevenueClassification?.tags?.includes('HAS_SOP')
    ).length;

    // Score calculation
    const score = calculateFounderDependencyScore({
      talentId,
      founderDependencyPercent: founderDepPercent,
      soplessProcessCount: dealsWithoutSOPs,
      manualOpsHoursPerWeek: 0, // Would need to track from tasks
      delegationCoveragePercent: sopTemplates.length > 0 ? 50 : 0,
      teamDepthScore: 0, // Would need team data
    });

    const riskRating = scoreToRiskRating(score);
    const valuationPenalty = calculateValuationPenalty(score, founderDepPercent);

    const recommendations = generateRecommendations({
      founderDependencyPercent: founderDepPercent,
      soplessProcessCount: dealsWithoutSOPs,
      score,
    });

    return await prisma.founderDependencyIndex.upsert({
      where: { talentId },
      create: {
        talentId,
        founderDependencyPercent: Math.round(founderDepPercent * 100) / 100,
        soplessProcessCount: dealsWithoutSOPs,
        manualOpsHoursPerWeek: 0,
        delegationCoveragePercent: sopTemplates.length > 0 ? 50 : 0,
        teamDepthScore: 0,
        riskRating,
        overallScore: score,
        projectedValuationPenalty: valuationPenalty,
        recommendations,
        lastComputedAt: new Date(),
      },
      update: {
        founderDependencyPercent: Math.round(founderDepPercent * 100) / 100,
        soplessProcessCount: dealsWithoutSOPs,
        manualOpsHoursPerWeek: 0,
        delegationCoveragePercent: sopTemplates.length > 0 ? 50 : 0,
        teamDepthScore: 0,
        riskRating,
        overallScore: score,
        projectedValuationPenalty: valuationPenalty,
        recommendations,
        lastComputedAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Error computing founder dependency index:', error);
    throw error;
  }
}

/**
 * Calculate founder dependency score (0-100, higher = more independent)
 */
function calculateFounderDependencyScore(input: FounderDependencyInput): number {
  const weights = {
    founderDependency: 0.4,
    soplessProcesses: 0.15,
    manualOps: 0.25,
    delegationGap: 0.2,
  };

  // Normalize inputs to 0-100 scale
  const founderDepScore = Math.max(0, 100 - input.founderDependencyPercent);
  const sopScore = Math.max(0, 100 - input.soplessProcessCount * 10); // 10 points per missing SOP
  const manualOpsScore = Math.max(0, 100 - input.manualOpsHoursPerWeek * 2); // 2 points per hour
  const delegationScore = input.delegationCoveragePercent;

  const rawScore =
    founderDepScore * weights.founderDependency +
    sopScore * weights.soplessProcesses +
    manualOpsScore * weights.manualOps +
    delegationScore * weights.delegationGap;

  return Math.round(rawScore);
}

/**
 * Convert score to risk rating
 */
function scoreToRiskRating(score: number): RiskRating {
  if (score >= 70) return RiskRating.LOW;
  if (score >= 40) return RiskRating.MEDIUM;
  return RiskRating.HIGH;
}

/**
 * Calculate valuation penalty based on founder dependency
 */
function calculateValuationPenalty(score: number, founderDepPercent: number): number {
  // Penalize by up to 50% based on founder dependency
  const maxPenalty = 50;
  const penalty = (1 - score / 100) * maxPenalty;
  return Math.round(penalty * 100) / 100;
}

/**
 * Generate actionable recommendations
 */
function generateRecommendations(data: {
  founderDependencyPercent: number;
  soplessProcessCount: number;
  score: number;
}): string[] {
  const recommendations: string[] = [];

  if (data.founderDependencyPercent > 70) {
    recommendations.push('HIGH PRIORITY: Reduce founder dependency to <50% of revenue');
    recommendations.push('ACTION: Identify and document processes that require founder presence');
    recommendations.push('ACTION: Train team members to replace founder in key roles');
  }

  if (data.soplessProcessCount > 3) {
    recommendations.push(
      `HIGH PRIORITY: Create SOPs for ${data.soplessProcessCount} critical processes`
    );
    recommendations.push('ACTION: Start with highest-revenue processes first');
    recommendations.push('ACTION: Get team to sign off on SOPs');
  }

  if (data.score < 40) {
    recommendations.push('CRITICAL: Business heavily depends on founder presence');
    recommendations.push('ACTION: This significantly impacts valuation and exit potential');
    recommendations.push('ACTION: Implement delegation plan immediately');
  }

  return recommendations;
}

/**
 * Update founder dependency index
 */
export async function updateFounderDependencyIndex(
  talentId: string,
  data: Partial<FounderDependencyInput>
) {
  try {
    const current = await getFounderDependencyIndex(talentId);

    const updated = {
      ...current,
      ...data,
    };

    const score = calculateFounderDependencyScore(updated as FounderDependencyInput);
    const riskRating = scoreToRiskRating(score);
    const valuationPenalty = calculateValuationPenalty(score, Number(updated.founderDependencyPercent));
    const recommendations = generateRecommendations({
      founderDependencyPercent: Number(updated.founderDependencyPercent),
      soplessProcessCount: updated.soplessProcessCount,
      score,
    });

    return await prisma.founderDependencyIndex.update({
      where: { talentId },
      data: {
        ...data,
        overallScore: score,
        riskRating,
        projectedValuationPenalty: valuationPenalty,
        recommendations,
        lastComputedAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Error updating founder dependency index:', error);
    throw error;
  }
}
