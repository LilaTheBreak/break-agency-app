/**
 * Revenue Classification Service
 * 
 * Enforces systematic tagging of all revenue sources with:
 * - Revenue type tags (founder-dependent, scalable, recurring, etc.)
 * - Deal value type classification (fixed, variable, hybrid)
 * - Renewal likelihood assessment
 * - High-risk deal flagging and validation
 */

import prisma from '../lib/prisma.js';

export enum RevenueTag {
  FOUNDER_DEPENDENT = 'FOUNDER_DEPENDENT',
  SCALABLE_INVENTORY = 'SCALABLE_INVENTORY',
  RECURRING_REVENUE = 'RECURRING_REVENUE',
  PLATFORM_OWNED = 'PLATFORM_OWNED',
  CREATOR_OWNED = 'CREATOR_OWNED',
}

export enum DealValueType {
  FIXED = 'FIXED',
  VARIABLE = 'VARIABLE',
  HYBRID = 'HYBRID',
}

export enum RenewalLikelihood {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export interface RevenueClassificationInput {
  dealId: string;
  tags: string[];
  dealValueType: DealValueType;
  revenueType: string;
  renewalLikelihood: RenewalLikelihood;
  estimatedMRR: number;
  estimatedChurnRisk: number;
  classifiedBy?: string;
}

/**
 * Get revenue classification for a deal
 */
export async function getRevenueClassification(dealId: string) {
  try {
    let classification = await prisma.revenueClassification.findUnique({
      where: { dealId },
    });

    if (!classification) {
      // Create default classification
      classification = await prisma.revenueClassification.create({
        data: {
          dealId,
          tags: [],
          dealValueType: DealValueType.FIXED,
          revenueType: 'OTHER',
          renewalLikelihood: RenewalLikelihood.MEDIUM,
        },
      });
    }

    return classification;
  } catch (error) {
    console.error('Error getting revenue classification:', error);
    throw error;
  }
}

/**
 * Create or update revenue classification
 */
export async function upsertRevenueClassification(data: RevenueClassificationInput) {
  try {
    // Validate tags
    const validTags = data.tags.filter((tag) =>
      Object.values(RevenueTag).includes(tag as RevenueTag)
    );

    // Check for high-risk configurations
    const risks = identifyRisks(validTags, data.dealValueType, data.estimatedChurnRisk);

    const classification = await prisma.revenueClassification.upsert({
      where: { dealId: data.dealId },
      create: {
        dealId: data.dealId,
        tags: validTags,
        dealValueType: data.dealValueType,
        revenueType: data.revenueType,
        renewalLikelihood: data.renewalLikelihood,
        estimatedMRR: data.estimatedMRR,
        estimatedChurnRisk: data.estimatedChurnRisk,
        isHighRisk: risks.length > 0,
        risksIdentified: risks,
        classifiedBy: data.classifiedBy,
        classifiedAt: new Date(),
      },
      update: {
        tags: validTags,
        dealValueType: data.dealValueType,
        revenueType: data.revenueType,
        renewalLikelihood: data.renewalLikelihood,
        estimatedMRR: data.estimatedMRR,
        estimatedChurnRisk: data.estimatedChurnRisk,
        isHighRisk: risks.length > 0,
        risksIdentified: risks,
        classifiedBy: data.classifiedBy,
        classifiedAt: new Date(),
      },
    });

    return classification;
  } catch (error) {
    console.error('Error upserting revenue classification:', error);
    throw error;
  }
}

/**
 * Identify risks in revenue classification
 */
function identifyRisks(
  tags: string[],
  dealValueType: DealValueType,
  churnRisk: number
): string[] {
  const risks: string[] = [];

  // Check for problematic combinations
  const isFounderDependent = tags.includes(RevenueTag.FOUNDER_DEPENDENT);
  const isRecurring = tags.includes(RevenueTag.RECURRING_REVENUE);
  const isPlatformOwned = tags.includes(RevenueTag.PLATFORM_OWNED);
  const isCreatorOwned = tags.includes(RevenueTag.CREATOR_OWNED);

  // Risk: Founder-dependent recurring revenue
  if (isFounderDependent && isRecurring) {
    risks.push('Founder-dependent recurring revenue creates business dependency');
  }

  // Risk: Platform-owned and creator-owned (conflicting)
  if (isPlatformOwned && isCreatorOwned) {
    risks.push('Conflicting ownership tags - clarify platform vs creator ownership');
  }

  // Risk: High churn for recurring revenue
  if (isRecurring && churnRisk > 0.3) {
    risks.push('High churn risk (>30%) for recurring revenue stream');
  }

  // Risk: Variable deal type without clear metrics
  if (dealValueType === DealValueType.VARIABLE && !isRecurring) {
    risks.push('Variable deal value should be recurring or have clear performance metrics');
  }

  // Risk: Platform-owned revenue only
  if (isPlatformOwned && !isCreatorOwned && !isFounderDependent) {
    risks.push('Platform-owned revenue limits scalability and ownership');
  }

  // Risk: Multiple founder dependencies
  if (isFounderDependent && tags.length > 3) {
    risks.push('Multiple dependencies on founder presence');
  }

  // Risk: Non-scalable, founder-dependent, one-off
  if (isFounderDependent && !tags.includes(RevenueTag.SCALABLE_INVENTORY)) {
    risks.push('Deal is founder-dependent and not scalable');
  }

  return risks;
}

/**
 * Get all high-risk deals for a talent
 */
export async function getHighRiskDeals(talentId: string) {
  try {
    const highRiskDeals = await prisma.deal.findMany({
      where: { talentId },
      include: {
        RevenueClassification: true,
        Brand: true,
      },
    });

    return highRiskDeals.filter((deal) => deal.RevenueClassification?.isHighRisk);
  } catch (error) {
    console.error('Error getting high-risk deals:', error);
    throw error;
  }
}

/**
 * Validate deal before closing - ensure complete classification
 */
export async function validateDealBeforeClosing(dealId: string): Promise<{
  isValid: boolean;
  errors: string[];
}> {
  try {
    const classification = await getRevenueClassification(dealId);

    const errors: string[] = [];

    if (!classification.tags || classification.tags.length === 0) {
      errors.push('Deal must have revenue type tags');
    }

    if (!classification.dealValueType) {
      errors.push('Deal must have value type (Fixed, Variable, or Hybrid)');
    }

    if (!classification.renewalLikelihood) {
      errors.push('Deal must have renewal likelihood assessment');
    }

    if (classification.estimatedMRR === undefined || classification.estimatedMRR === null) {
      errors.push('Deal must have estimated MRR');
    }

    if (classification.isHighRisk && !classification.classifiedBy) {
      errors.push('High-risk deals must be classified by manager');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  } catch (error) {
    console.error('Error validating deal:', error);
    throw error;
  }
}

/**
 * Auto-classify a deal based on available data
 */
export async function autoClassifyDeal(dealId: string) {
  try {
    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      include: { Talent: true, Brand: true },
    });

    if (!deal) {
      throw new Error('Deal not found');
    }

    // Infer tags from deal data
    const tags: string[] = [];
    let dealValueType = DealValueType.FIXED;
    let renewalLikelihood = RenewalLikelihood.MEDIUM;

    // Check if it's a creator-owned deal (no platform involvement)
    if (!deal.brandId || deal.brandId === deal.talentId) {
      tags.push(RevenueTag.CREATOR_OWNED);
    } else {
      tags.push(RevenueTag.PLATFORM_OWNED);
    }

    // Check if it requires founder
    if (deal.platforms && deal.platforms.length > 0) {
      tags.push(RevenueTag.FOUNDER_DEPENDENT);
    }

    // Check if it could be recurring
    if (deal.campaignName && deal.campaignName.toLowerCase().includes('retainer')) {
      tags.push(RevenueTag.RECURRING_REVENUE);
      renewalLikelihood = RenewalLikelihood.HIGH;
    }

    // Estimate value
    const estimatedMRR = deal.value ? deal.value / 12 : 0;

    return await upsertRevenueClassification({
      dealId,
      tags,
      dealValueType,
      revenueType: 'SPONSORSHIP',
      renewalLikelihood,
      estimatedMRR,
      estimatedChurnRisk: 0.2,
    });
  } catch (error) {
    console.error('Error auto-classifying deal:', error);
    throw error;
  }
}
