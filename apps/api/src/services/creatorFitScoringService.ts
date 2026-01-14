/**
 * Creator Fit Scoring Service - TRANSPARENT, NO MAGIC
 * 
 * This service calculates creator-brand fit scores using ONLY real, measurable data.
 * Every score component is explainable and transparent.
 * 
 * Score Breakdown (0-100):
 * - Audience Size Match (0-25): How well does creator's audience size match brand's typical campaign size
 * - Engagement Quality (0-25): Past deal success rate, completion rate from deal history
 * - Collaboration History (0-25): Number of successful past deals, recency, relationship strength
 * - Category Alignment (0-25): Match between brand industry and talent niches/categories
 * 
 * NO AI, NO BLACK BOX - Every number is derived from database records with clear logic.
 */

import prisma from '../lib/prisma';

interface FitScoreResult {
  totalScore: number; // 0-100
  audienceScore: number; // 0-25
  engagementScore: number; // 0-25
  historyScore: number; // 0-25
  categoryScore: number; // 0-25
  explanation: string;
  calculationDetails: {
    audience: {
      score: number;
      reason: string;
      data: any;
    };
    engagement: {
      score: number;
      reason: string;
      data: any;
    };
    history: {
      score: number;
      reason: string;
      data: any;
    };
    category: {
      score: number;
      reason: string;
      data: any;
    };
  };
}

/**
 * Calculate transparent fit score between a talent and brand
 */
export async function calculateFitScore(
  talentId: string,
  brandId: string
): Promise<FitScoreResult> {
  // Fetch talent data
  const talent = await prisma.talent.findUnique({
    where: { id: talentId },
    include: {
      User: {
        select: {
          name: true,
          email: true
        }
      },
      Deal: {
        where: {
          brandId: brandId
        },
        select: {
          id: true,
          value: true,
          stage: true,
          createdAt: true,
          closedAt: true
        }
      }
    }
  });

  const brand = await prisma.brand.findUnique({
    where: { id: brandId },
    include: {
      Deal: {
        select: {
          value: true,
          stage: true,
          createdAt: true
        }
      }
    }
  });

  if (!talent || !brand) {
    throw new Error("Talent or Brand not found");
  }

  // Calculate each component
  const audienceResult = calculateAudienceScore(talent, brand);
  const engagementResult = calculateEngagementScore(talent, brand);
  const historyResult = calculateHistoryScore(talent, brand);
  const categoryResult = calculateCategoryScore(talent, brand);

  const totalScore = 
    audienceResult.score + 
    engagementResult.score + 
    historyResult.score + 
    categoryResult.score;

  const explanation = buildExplanation({
    audience: audienceResult,
    engagement: engagementResult,
    history: historyResult,
    category: categoryResult,
    totalScore
  });

  return {
    totalScore,
    audienceScore: audienceResult.score,
    engagementScore: engagementResult.score,
    historyScore: historyResult.score,
    categoryScore: categoryResult.score,
    explanation,
    calculationDetails: {
      audience: audienceResult,
      engagement: engagementResult,
      history: historyResult,
      category: categoryResult
    }
  };
}

/**
 * Audience Size Match (0-25)
 * Logic: Compare talent's typical deal size to brand's average campaign budget
 * - No data available: 12 (neutral/unknown)
 * - Perfect match (±20%): 25
 * - Good match (±50%): 18-20
 * - Okay match (±100%): 10-15
 * - Poor match (>2x difference): 5-8
 */
function calculateAudienceScore(talent: any, brand: any): { score: number; reason: string; data: any } {
  const talentDeals = talent.Deal || [];
  const brandDeals = brand.Deal || [];

  // Calculate talent's average deal value
  const talentDealValues = talentDeals
    .filter((d: any) => d.value && d.value > 0)
    .map((d: any) => d.value);
  
  const talentAvgDeal = talentDealValues.length > 0
    ? talentDealValues.reduce((sum: number, val: number) => sum + val, 0) / talentDealValues.length
    : null;

  // Calculate brand's average deal value across ALL talents
  const brandDealValues = brandDeals
    .filter((d: any) => d.value && d.value > 0)
    .map((d: any) => d.value);

  const brandAvgDeal = brandDealValues.length > 0
    ? brandDealValues.reduce((sum: number, val: number) => sum + val, 0) / brandDealValues.length
    : null;

  // No data = neutral score
  if (!talentAvgDeal && !brandAvgDeal) {
    return {
      score: 12,
      reason: "No deal history available for size comparison (neutral score)",
      data: { talentAvgDeal: null, brandAvgDeal: null, talentDealCount: 0, brandDealCount: 0 }
    };
  }

  // If only one has data, use a moderate score
  if (!talentAvgDeal || !brandAvgDeal) {
    return {
      score: 10,
      reason: "Limited deal history for accurate size comparison",
      data: { 
        talentAvgDeal, 
        brandAvgDeal, 
        talentDealCount: talentDealValues.length, 
        brandDealCount: brandDealValues.length 
      }
    };
  }

  // Calculate percentage difference
  const ratio = talentAvgDeal / brandAvgDeal;
  const percentDiff = Math.abs(1 - ratio) * 100;

  let score = 0;
  let reason = "";

  if (percentDiff <= 20) {
    score = 25;
    reason = `Excellent match: Talent's avg deal ($${Math.round(talentAvgDeal)}) aligns perfectly with brand's budget ($${Math.round(brandAvgDeal)})`;
  } else if (percentDiff <= 50) {
    score = 20;
    reason = `Good match: Talent's avg deal ($${Math.round(talentAvgDeal)}) is close to brand's budget ($${Math.round(brandAvgDeal)})`;
  } else if (percentDiff <= 100) {
    score = 12;
    reason = `Moderate match: Talent's avg deal ($${Math.round(talentAvgDeal)}) differs from brand's typical budget ($${Math.round(brandAvgDeal)})`;
  } else {
    score = 6;
    reason = `Weak match: Significant difference between talent's avg deal ($${Math.round(talentAvgDeal)}) and brand's budget ($${Math.round(brandAvgDeal)})`;
  }

  return {
    score,
    reason,
    data: {
      talentAvgDeal: Math.round(talentAvgDeal),
      brandAvgDeal: Math.round(brandAvgDeal),
      percentDiff: Math.round(percentDiff),
      talentDealCount: talentDealValues.length,
      brandDealCount: brandDealValues.length
    }
  };
}

/**
 * Engagement Quality (0-25)
 * Logic: Based on past deal completion rates with this brand
 * - No history with brand: 12 (neutral/unknown)
 * - 90-100% completion rate: 25
 * - 70-89% completion rate: 18-20
 * - 50-69% completion rate: 10-15
 * - <50% completion rate: 5-8
 */
function calculateEngagementScore(talent: any, brand: any): { score: number; reason: string; data: any } {
  const dealsWithBrand = talent.Deal || [];

  if (dealsWithBrand.length === 0) {
    return {
      score: 12,
      reason: "No past deals with this brand (neutral score)",
      data: { totalDeals: 0, completedDeals: 0, completionRate: null }
    };
  }

  // Count completed deals vs total deals
  const completedStages = ["COMPLETED", "PAYMENT_RECEIVED"];
  const completedDeals = dealsWithBrand.filter((d: any) => 
    completedStages.includes(d.stage)
  ).length;

  const completionRate = (completedDeals / dealsWithBrand.length) * 100;

  let score = 0;
  let reason = "";

  if (completionRate >= 90) {
    score = 25;
    reason = `Excellent track record: ${completedDeals}/${dealsWithBrand.length} deals completed (${Math.round(completionRate)}%)`;
  } else if (completionRate >= 70) {
    score = 19;
    reason = `Strong track record: ${completedDeals}/${dealsWithBrand.length} deals completed (${Math.round(completionRate)}%)`;
  } else if (completionRate >= 50) {
    score = 13;
    reason = `Moderate track record: ${completedDeals}/${dealsWithBrand.length} deals completed (${Math.round(completionRate)}%)`;
  } else {
    score = 7;
    reason = `Limited success: Only ${completedDeals}/${dealsWithBrand.length} deals completed (${Math.round(completionRate)}%)`;
  }

  return {
    score,
    reason,
    data: {
      totalDeals: dealsWithBrand.length,
      completedDeals,
      completionRate: Math.round(completionRate)
    }
  };
}

/**
 * Collaboration History (0-25)
 * Logic: Number of deals, recency, relationship depth
 * - No deals with brand: 5 (new relationship)
 * - 1 deal: 10-15 (depending on recency)
 * - 2-3 deals: 15-20
 * - 4+ deals: 20-25 (strong relationship)
 * - Bonus for recent deals (last 6 months): +2-3
 */
function calculateHistoryScore(talent: any, brand: any): { score: number; reason: string; data: any } {
  const dealsWithBrand = talent.Deal || [];
  const dealCount = dealsWithBrand.length;

  if (dealCount === 0) {
    return {
      score: 5,
      reason: "No previous deals with this brand (new relationship opportunity)",
      data: { dealCount: 0, recentDeals: 0, oldestDeal: null, newestDeal: null }
    };
  }

  // Check for recent deals (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  const recentDeals = dealsWithBrand.filter((d: any) => 
    new Date(d.createdAt) > sixMonthsAgo
  ).length;

  // Sort by date to find oldest and newest
  const sortedDeals = [...dealsWithBrand].sort((a: any, b: any) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  const oldestDeal = sortedDeals[0]?.createdAt;
  const newestDeal = sortedDeals[sortedDeals.length - 1]?.createdAt;

  let baseScore = 0;
  let reason = "";

  if (dealCount >= 4) {
    baseScore = 22;
    reason = `Strong relationship: ${dealCount} deals completed`;
  } else if (dealCount >= 2) {
    baseScore = 17;
    reason = `Developing relationship: ${dealCount} deals completed`;
  } else {
    baseScore = 12;
    reason = `New relationship: 1 deal completed`;
  }

  // Bonus for recent activity
  let recencyBonus = 0;
  if (recentDeals > 0) {
    recencyBonus = 3;
    reason += ` with ${recentDeals} recent deal${recentDeals > 1 ? 's' : ''}`;
  }

  const score = Math.min(25, baseScore + recencyBonus);

  return {
    score,
    reason,
    data: {
      dealCount,
      recentDeals,
      oldestDeal: oldestDeal ? new Date(oldestDeal).toISOString().split('T')[0] : null,
      newestDeal: newestDeal ? new Date(newestDeal).toISOString().split('T')[0] : null
    }
  };
}

/**
 * Category Alignment (0-25)
 * Logic: Match between brand's preferred creator types / industry and talent's categories
 * - Perfect match (3+ overlapping categories): 25
 * - Good match (2 overlapping): 20
 * - Moderate match (1 overlapping): 15
 * - Weak match (related but not exact): 10
 * - No match: 5
 */
function calculateCategoryScore(talent: any, brand: any): { score: number; reason: string; data: any } {
  const talentCategories = talent.categories || [];
  const brandPreferred = brand.preferredCreatorTypes || [];

  if (talentCategories.length === 0 && brandPreferred.length === 0) {
    return {
      score: 12,
      reason: "No category data available for comparison (neutral score)",
      data: { talentCategories: [], brandPreferred: [], matches: [] }
    };
  }

  // Find exact matches (case-insensitive)
  const matches = talentCategories.filter((tc: string) =>
    brandPreferred.some((bp: string) => 
      tc.toLowerCase() === bp.toLowerCase()
    )
  );

  let score = 0;
  let reason = "";

  if (matches.length >= 3) {
    score = 25;
    reason = `Excellent category alignment: ${matches.length} matching categories (${matches.join(', ')})`;
  } else if (matches.length === 2) {
    score = 20;
    reason = `Good category alignment: 2 matching categories (${matches.join(', ')})`;
  } else if (matches.length === 1) {
    score = 15;
    reason = `Moderate category alignment: 1 matching category (${matches[0]})`;
  } else if (talentCategories.length > 0 && brandPreferred.length > 0) {
    score = 8;
    reason = `Limited category alignment: Creator (${talentCategories.join(', ')}) vs Brand preference (${brandPreferred.join(', ')})`;
  } else {
    score = 10;
    reason = "Insufficient category data for accurate matching";
  }

  return {
    score,
    reason,
    data: {
      talentCategories,
      brandPreferred,
      matches
    }
  };
}

/**
 * Build human-readable explanation of the fit score
 */
function buildExplanation(components: {
  audience: any;
  engagement: any;
  history: any;
  category: any;
  totalScore: number;
}): string {
  const parts = [
    `Total Fit Score: ${components.totalScore}/100`,
    "",
    `🎯 Audience Match (${components.audience.score}/25):`,
    components.audience.reason,
    "",
    `⚡ Engagement Quality (${components.engagement.score}/25):`,
    components.engagement.reason,
    "",
    `🤝 Collaboration History (${components.history.score}/25):`,
    components.history.reason,
    "",
    `📊 Category Alignment (${components.category.score}/25):`,
    components.category.reason,
  ];

  return parts.join("\n");
}

/**
 * Calculate fit scores for multiple talents with a single brand (batch processing)
 */
export async function calculateBatchFitScores(
  brandId: string,
  talentIds: string[]
): Promise<Array<FitScoreResult & { talentId: string; talentName: string }>> {
  const results = [];

  for (const talentId of talentIds) {
    try {
      const fitScore = await calculateFitScore(talentId, brandId);
      
      // Get talent name for response
      const talent = await prisma.talent.findUnique({
        where: { id: talentId },
        select: { name: true }
      });

      results.push({
        talentId,
        talentName: talent?.name || "Unknown",
        ...fitScore
      });
    } catch (error) {
      console.error(`Failed to calculate fit for talent ${talentId}:`, error);
      // Continue with other talents even if one fails
    }
  }

  // Sort by total score descending
  results.sort((a, b) => b.totalScore - a.totalScore);

  return results;
}

/**
 * Save a calculated fit score to the database
 */
export async function saveFitScore(
  brandId: string,
  talentId: string,
  campaignId: string | null,
  fitScore: FitScoreResult
): Promise<void> {
  const { generateId } = await import("../lib/utils.js");

  await prisma.creatorFitScore.create({
    data: {
      id: generateId(),
      brandId,
      talentId,
      campaignId,
      totalScore: fitScore.totalScore,
      audienceScore: fitScore.audienceScore,
      engagementScore: fitScore.engagementScore,
      historyScore: fitScore.historyScore,
      categoryScore: fitScore.categoryScore,
      explanation: fitScore.explanation,
      calculationDetails: fitScore.calculationDetails
    }
  });
}

/**
 * Get all saved fit scores for a brand
 */
export async function getBrandFitScores(brandId: string): Promise<any[]> {
  return prisma.creatorFitScore.findMany({
    where: { brandId },
    include: {
      Talent: {
        select: {
          id: true,
          name: true,
          categories: true,
          User: {
            select: {
              name: true,
              email: true,
              avatarUrl: true
            }
          }
        }
      }
    },
    orderBy: {
      totalScore: "desc"
    }
  });
}

/**
 * Get all saved fit scores for a talent
 */
export async function getTalentFitScores(talentId: string): Promise<any[]> {
  return prisma.creatorFitScore.findMany({
    where: { talentId },
    include: {
      Brand: {
        select: {
          id: true,
          name: true,
          preferredCreatorTypes: true
        }
      }
    },
    orderBy: {
      totalScore: "desc"
    }
  });
}
