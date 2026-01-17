/**
 * Exit Readiness Scorecard Service
 * 
 * Computes the flagship "Exit Readiness" metric that answers:
 * "How sellable is this creator business?"
 * 
 * Weighted scoring across:
 * - Revenue Predictability (20%)
 * - Founder Independence (20%)
 * - Team & System Depth (15%)
 * - IP Ownership (15%)
 * - Gross Margin (10%)
 * - Platform Risk (10%)
 * - Recurring Revenue % (10%)
 */

import prisma from '../lib/prisma.js';

export enum ExitReadinessCategory {
  UNDERDEVELOPED = 'UNDERDEVELOPED', // 0-35
  DEVELOPING = 'DEVELOPING', // 35-65
  INVESTMENT_GRADE = 'INVESTMENT_GRADE', // 65-85
  ENTERPRISE_CLASS = 'ENTERPRISE_CLASS', // 85-100
}

export interface ExitReadinessRecommendation {
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  area: string;
  action: string;
  estimatedImpact: number; // % improvement
  effort: '1HR' | '1DAY' | '1WEEK' | '1MONTH';
  valueMultiplier: number;
}

/**
 * Get exit readiness scorecard for a talent
 */
export async function getExitReadinessScore(talentId: string) {
  try {
    let scorecard = await prisma.exitReadinessScore.findUnique({
      where: { talentId },
    });

    if (!scorecard) {
      scorecard = await computeExitReadinessScore(talentId);
    }

    return scorecard;
  } catch (error) {
    console.error('Error getting exit readiness score:', error);
    throw error;
  }
}

/**
 * Compute exit readiness score from business data
 */
export async function computeExitReadinessScore(talentId: string) {
  try {
    // Gather all necessary data
    const [
      revenueStreams,
      deals,
      ownedAssets,
      sopTemplates,
      founderDependency,
      enterpriseValue,
    ] = await Promise.all([
      prisma.revenueStream.findMany({ where: { talentId, isActive: true } }),
      prisma.deal.findMany({
        where: { talentId },
        include: { RevenueClassification: true },
      }),
      prisma.ownedAsset.findMany({ where: { talentId } }),
      prisma.sOPTemplate.findMany({ where: { ownerUserId: talentId } }),
      prisma.founderDependencyIndex.findUnique({ where: { talentId } }).catch(() => null),
      prisma.enterpriseValueMetrics.findUnique({ where: { talentId } }).catch(() => null),
    ]);

    // Calculate component scores
    const scores = calculateComponentScores({
      revenueStreams,
      deals,
      ownedAssets,
      sopTemplates,
      founderDependency,
      enterpriseValue,
    });

    // Calculate overall score
    const overallScore = calculateOverallScore(scores);
    const category = scoreToCategory(overallScore);

    // Generate recommendations
    const recommendations = generateExitReadinessRecommendations(scores);

    return await prisma.exitReadinessScore.upsert({
      where: { talentId },
      create: {
        talentId,
        overallScore: Math.round(Number(overallScore)),
        category,
        revenuePredicability: Math.round(Number(scores.revenuePredicability)),
        founderIndependence: Math.round(Number(scores.founderIndependence)),
        teamDepth: Math.round(Number(scores.teamDepth)),
        ipOwnership: Math.round(Number(scores.ipOwnership)),
        grossMargin: Math.round(Number(scores.grossMargin)),
        platformRisk: Math.round(Number(scores.platformRisk)),
        recurringRevenuePercent: Math.round(Number(scores.recurringRevenuePercent)),
        recommendations: recommendations as any,
        lastComputedAt: new Date(),
      },
      update: {
        overallScore: Math.round(Number(overallScore)),
        category,
        revenuePredicability: Math.round(Number(scores.revenuePredicability)),
        founderIndependence: Math.round(Number(scores.founderIndependence)),
        teamDepth: Math.round(Number(scores.teamDepth)),
        ipOwnership: Math.round(Number(scores.ipOwnership)),
        grossMargin: Math.round(Number(scores.grossMargin)),
        platformRisk: Math.round(Number(scores.platformRisk)),
        recurringRevenuePercent: Math.round(Number(scores.recurringRevenuePercent)),
        recommendations: recommendations as any,
        lastComputedAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Error computing exit readiness score:', error);
    throw error;
  }
}

/**
 * Calculate individual component scores
 */
function calculateComponentScores(data: any) {
  const {
    revenueStreams,
    deals,
    ownedAssets,
    sopTemplates,
    founderDependency,
    enterpriseValue,
  } = data;

  // 1. Revenue Predicability (20%) - based on MRR consistency
  const revenuePredicability = calculateRevenuePredicability(revenueStreams);

  // 2. Founder Independence (20%) - inverse of founder dependency
  const founderIndependence = founderDependency
    ? 100 - founderDependency.overallScore
    : calculateFounderIndependenceFromDeals(deals);

  // 3. Team & System Depth (15%) - based on SOPs and team size
  const teamDepth = calculateTeamDepth(sopTemplates, deals);

  // 4. IP Ownership (15%) - based on owned assets
  const ipOwnership = calculateIPOwnership(ownedAssets);

  // 5. Gross Margin (10%) - estimated from revenue vs costs
  const grossMargin = calculateGrossMargin(revenueStreams);

  // 6. Platform Risk (10%) - single platform dependency
  const platformRisk = calculatePlatformRisk(revenueStreams);

  // 7. Recurring Revenue % (10%) - % that auto-renews
  const recurringRevenuePercent = calculateRecurringRevenuePercent(revenueStreams);

  return {
    revenuePredicability,
    founderIndependence,
    teamDepth,
    ipOwnership,
    grossMargin,
    platformRisk,
    recurringRevenuePercent,
  };
}

/**
 * Revenue predicability score based on MRR consistency
 */
function calculateRevenuePredicability(revenueStreams: any[]): number {
  if (revenueStreams.length === 0) return 10;

  // Higher score if more recurring revenue
  const recurringCount = revenueStreams.filter((s) => s.isRecurring).length;
  const recurringPercent = (recurringCount / revenueStreams.length) * 100;

  // Lower score if high churn
  const avgChurn = revenueStreams.reduce((sum, s) => sum + Number(s.churnRate), 0) / revenueStreams.length;
  const churnPenalty = Math.min(40, (avgChurn / 100) * 40);

  return Math.max(0, Math.round(recurringPercent * 0.7 - churnPenalty));
}

/**
 * Founder independence from deals
 */
function calculateFounderIndependenceFromDeals(deals: any[]): number {
  if (deals.length === 0) return 50;

  const dealsWithFounderDep = deals.filter((d) =>
    d.RevenueClassification?.tags?.includes('FOUNDER_DEPENDENT')
  ).length;

  const depPercent = (dealsWithFounderDep / deals.length) * 100;
  return Math.max(0, 100 - depPercent);
}

/**
 * Team and system depth score
 */
function calculateTeamDepth(sopTemplates: any[], deals: any[]): number {
  if (deals.length === 0) return 20;

  // More SOPs = higher score
  const sopScore = Math.min(50, sopTemplates.length * 10);

  // Higher if most deals are documented
  const dealsWithSOPs = Math.min(50, deals.length > 0 ? (sopTemplates.length / deals.length) * 50 : 0);

  return Math.round((sopScore + dealsWithSOPs) / 2);
}

/**
 * IP ownership score
 */
function calculateIPOwnership(ownedAssets: any[]): number {
  if (ownedAssets.length === 0) return 20;

  // Count valuable assets
  const valuableAssets = ownedAssets.filter(
    (a) => Number(a.revenueGeneratedAnnual) > 0 || Number(a.estimatedValue) > 0
  ).length;

  const assetScore = Math.min(50, valuableAssets * 10);

  // Protected/owned assets get bonus
  const protectedAssets = ownedAssets.filter((a) => a.legalStatus === 'PROTECTED').length;
  const protectionBonus = protectedAssets * 5;

  return Math.round(Math.min(100, assetScore + protectionBonus));
}

/**
 * Gross margin estimate
 */
function calculateGrossMargin(revenueStreams: any[]): number {
  if (revenueStreams.length === 0) return 50;

  // Default to 70% for digital products/services
  // Could be refined with actual cost data
  return 70;
}

/**
 * Platform risk from single-platform dependency
 */
function calculatePlatformRisk(revenueStreams: any[]): number {
  if (revenueStreams.length === 0) return 0;

  // Penalize heavily for platform-owned revenue only
  const platformOwnedStreams = revenueStreams.filter((s) => s.ownershipStatus === 'PLATFORM').length;
  const creatorOwnedStreams = revenueStreams.filter((s) => s.ownershipStatus === 'OWNED').length;

  if (creatorOwnedStreams === 0 && platformOwnedStreams > 0) {
    return 10; // Heavy penalty
  }

  // Score improves with diversification
  const diversification = Math.min(100, revenueStreams.length * 15);
  return Math.max(0, 100 - diversification);
}

/**
 * Recurring revenue percentage
 */
function calculateRecurringRevenuePercent(revenueStreams: any[]): number {
  if (revenueStreams.length === 0) return 0;

  const totalMRR = revenueStreams.reduce((sum, s) => sum + Number(s.monthlyRevenue), 0);
  const recurringMRR = revenueStreams
    .filter((s) => s.isRecurring)
    .reduce((sum, s) => sum + Number(s.monthlyRevenue), 0);

  return totalMRR > 0 ? Math.round((recurringMRR / totalMRR) * 100) : 0;
}

/**
 * Calculate weighted overall score
 */
function calculateOverallScore(scores: {
  revenuePredicability: number;
  founderIndependence: number;
  teamDepth: number;
  ipOwnership: number;
  grossMargin: number;
  platformRisk: number;
  recurringRevenuePercent: number;
}): number {
  const weights = {
    revenuePredicability: 0.2,
    founderIndependence: 0.2,
    teamDepth: 0.15,
    ipOwnership: 0.15,
    grossMargin: 0.1,
    platformRisk: 0.1,
    recurringRevenuePercent: 0.1,
  };

  const weighted =
    scores.revenuePredicability * weights.revenuePredicability +
    scores.founderIndependence * weights.founderIndependence +
    scores.teamDepth * weights.teamDepth +
    scores.ipOwnership * weights.ipOwnership +
    scores.grossMargin * weights.grossMargin +
    scores.platformRisk * weights.platformRisk +
    scores.recurringRevenuePercent * weights.recurringRevenuePercent;

  return Math.round(weighted);
}

/**
 * Map score to category
 */
function scoreToCategory(score: number): ExitReadinessCategory {
  if (score >= 85) return ExitReadinessCategory.ENTERPRISE_CLASS;
  if (score >= 65) return ExitReadinessCategory.INVESTMENT_GRADE;
  if (score >= 35) return ExitReadinessCategory.DEVELOPING;
  return ExitReadinessCategory.UNDERDEVELOPED;
}

/**
 * Generate actionable recommendations ranked by impact
 */
function generateExitReadinessRecommendations(scores: any): ExitReadinessRecommendation[] {
  const recommendations: ExitReadinessRecommendation[] = [];

  // Identify lowest-scoring areas
  const areas = [
    { name: 'Revenue Predicability', score: scores.revenuePredicability, weight: 0.2 },
    { name: 'Founder Independence', score: scores.founderIndependence, weight: 0.2 },
    { name: 'Team & System Depth', score: scores.teamDepth, weight: 0.15 },
    { name: 'IP Ownership', score: scores.ipOwnership, weight: 0.15 },
    { name: 'Gross Margin', score: scores.grossMargin, weight: 0.1 },
    { name: 'Platform Risk', score: scores.platformRisk, weight: 0.1 },
    { name: 'Recurring Revenue %', score: scores.recurringRevenuePercent, weight: 0.1 },
  ];

  // Sort by impact (weight * gap from 100)
  const sortedByImpact = areas
    .map((area) => ({
      ...area,
      impact: area.weight * (100 - area.score),
    }))
    .sort((a, b) => b.impact - a.impact);

  // Generate recommendations for top 3 areas
  for (let i = 0; i < Math.min(3, sortedByImpact.length); i++) {
    const area = sortedByImpact[i];

    if (area.name === 'Revenue Predicability' && area.score < 70) {
      recommendations.push({
        priority: 'HIGH',
        area: area.name,
        action: 'Increase recurring revenue streams with auto-renewal contracts',
        estimatedImpact: 20,
        effort: '1MONTH',
        valueMultiplier: 1.25,
      });
    }

    if (area.name === 'Founder Independence' && area.score < 70) {
      recommendations.push({
        priority: 'HIGH',
        area: area.name,
        action: 'Document and delegate founder-dependent processes, create SOPs',
        estimatedImpact: 25,
        effort: '1MONTH',
        valueMultiplier: 1.5,
      });
    }

    if (area.name === 'Team & System Depth' && area.score < 70) {
      recommendations.push({
        priority: 'MEDIUM',
        area: area.name,
        action: 'Create SOPs for all critical business processes',
        estimatedImpact: 15,
        effort: '1WEEK',
        valueMultiplier: 1.2,
      });
    }

    if (area.name === 'IP Ownership' && area.score < 70) {
      recommendations.push({
        priority: 'MEDIUM',
        area: area.name,
        action: 'Build owned assets: email list, community, courses, SaaS tools',
        estimatedImpact: 20,
        effort: '1MONTH',
        valueMultiplier: 1.3,
      });
    }

    if (area.name === 'Platform Risk' && area.score > 30) {
      recommendations.push({
        priority: 'HIGH',
        area: area.name,
        action: 'Diversify revenue streams away from single platform dependency',
        estimatedImpact: 15,
        effort: '1MONTH',
        valueMultiplier: 1.4,
      });
    }
  }

  return recommendations;
}
