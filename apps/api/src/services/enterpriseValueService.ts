/**
 * Enterprise Value Service
 * 
 * Computes and manages enterprise value metrics including:
 * - Revenue breakdown (recurring vs one-off, founder-dependent vs scalable, owned vs platform)
 * - Risk indicators (concentration, platform dependency, founder dependency)
 * - Monthly recurring revenue (MRR) and projections
 * - IP and owned asset inventory
 */

import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma.js';

export interface EnterpriseValueMetricsInput {
  talentId: string;
  recurringRevenuePercent: number;
  founderDependentPercent: number;
  creatorOwnedPercent: number;
  revenueConcentrationRisk: number;
  platformDependencyScore: number;
  monthlyRecurringRevenue: number;
  mrrGrowthRate: number;
  projectedAnnualRevenue: number;
  ownedAssetCount: number;
  revenueGeneratingAssets: number;
  totalOwnedAssetValue: number;
}

/**
 * Get or create enterprise value metrics for a talent
 */
export async function getEnterpriseValueMetrics(talentId: string) {
  try {
    const metrics = await prisma.enterpriseValueMetrics.findUnique({
      where: { talentId },
    });

    if (!metrics) {
      // Create default metrics
      return await createEnterpriseValueMetrics(talentId);
    }

    return metrics;
  } catch (error) {
    console.error('Error getting enterprise value metrics:', error);
    throw error;
  }
}

/**
 * Create new enterprise value metrics record
 */
export async function createEnterpriseValueMetrics(
  talentId: string,
  data?: Partial<EnterpriseValueMetricsInput>
) {
  try {
    return await prisma.enterpriseValueMetrics.create({
      data: {
        talentId,
        recurringRevenuePercent: parseFloat(String(data?.recurringRevenuePercent || 0)),
        founderDependentPercent: parseFloat(String(data?.founderDependentPercent || 0)),
        creatorOwnedPercent: parseFloat(String(data?.creatorOwnedPercent || 0)),
        revenueConcentrationRisk: parseFloat(String(data?.revenueConcentrationRisk || 0)),
        platformDependencyScore: parseInt(String(data?.platformDependencyScore || 0), 10),
        monthlyRecurringRevenue: parseFloat(String(data?.monthlyRecurringRevenue || 0)),
        mrrGrowthRate: parseFloat(String(data?.mrrGrowthRate || 0)),
        projectedAnnualRevenue: parseFloat(String(data?.projectedAnnualRevenue || 0)),
        ownedAssetCount: parseInt(String(data?.ownedAssetCount || 0), 10),
        revenueGeneratingAssets: parseInt(String(data?.revenueGeneratingAssets || 0), 10),
        totalOwnedAssetValue: parseFloat(String(data?.totalOwnedAssetValue || 0)),
        lastComputedAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Error creating enterprise value metrics:', error);
    throw error;
  }
}

/**
 * Compute enterprise value metrics from actual business data
 */
export async function computeEnterpriseValueMetrics(talentId: string) {
  try {
    // Get all revenue streams for this talent
    const revenueStreams = await prisma.revenueStream.findMany({
      where: { talentId, isActive: true },
    });

    // Get all deals for revenue concentration
    const deals = await prisma.deal.findMany({
      where: { talentId },
      include: {
        RevenueClassification: true,
        Brand: true,
      },
    });

    // Get owned assets
    const ownedAssets = await prisma.ownedAsset.findMany({
      where: { talentId },
    });

    // Calculate metrics
    let totalMRR = 0;
    let recurringMRR = 0;
    let founderDependentMRR = 0;
    let creatorOwnedMRR = 0;

    for (const stream of revenueStreams) {
      totalMRR += Number(stream.monthlyRevenue);
      if (stream.isRecurring) {
        recurringMRR += Number(stream.monthlyRevenue);
      }
      if (Number(stream.founderDependency) > 0) {
        founderDependentMRR += Number(stream.monthlyRevenue) * (Number(stream.founderDependency) / 100);
      }
      if (stream.ownershipStatus === 'OWNED') {
        creatorOwnedMRR += Number(stream.monthlyRevenue);
      }
    }

    // Calculate concentration risk (% from top 3 brands)
    const brandRevenue: { [key: string]: number } = {};
    for (const deal of deals) {
      const brandName = deal.Brand?.name || deal.brandName || 'Unknown';
      brandRevenue[brandName] = (brandRevenue[brandName] || 0) + (deal.value || 0);
    }

    const topBrandRevenue = Object.values(brandRevenue)
      .sort((a, b) => b - a)
      .slice(0, 3)
      .reduce((sum, val) => sum + val, 0);

    const totalDealRevenue = Object.values(brandRevenue).reduce((sum, val) => sum + val, 0);
    const concentrationRisk = totalDealRevenue > 0 ? (topBrandRevenue / totalDealRevenue) * 100 : 0;

    // Calculate metrics
    const recurringPercent = totalMRR > 0 ? (recurringMRR / totalMRR) * 100 : 0;
    const founderDepPercent = totalMRR > 0 ? (founderDependentMRR / totalMRR) * 100 : 0;
    const creatorOwnedPercent = totalMRR > 0 ? (creatorOwnedMRR / totalMRR) * 100 : 0;

    // Revenue generating assets
    const revenueGeneratingAssets = ownedAssets.filter(
      (asset) => Number(asset.revenueGeneratedAnnual) > 0
    ).length;

    const totalAssetValue = ownedAssets.reduce(
      (sum, asset) => sum + Number(asset.estimatedValue || 0),
      0
    );

    // Update metrics
    return await prisma.enterpriseValueMetrics.upsert({
      where: { talentId },
      create: {
        talentId,
        recurringRevenuePercent: Math.round(recurringPercent * 100) / 100,
        founderDependentPercent: Math.round(founderDepPercent * 100) / 100,
        creatorOwnedPercent: Math.round(creatorOwnedPercent * 100) / 100,
        revenueConcentrationRisk: Math.round(concentrationRisk * 100) / 100,
        platformDependencyScore: 50, // TODO: compute from platform-owned deals
        monthlyRecurringRevenue: recurringMRR,
        mrrGrowthRate: 0, // TODO: compute from historical data
        projectedAnnualRevenue: totalMRR * 12,
        ownedAssetCount: ownedAssets.length,
        revenueGeneratingAssets,
        totalOwnedAssetValue: totalAssetValue,
        lastComputedAt: new Date(),
      },
      update: {
        recurringRevenuePercent: Math.round(recurringPercent * 100) / 100,
        founderDependentPercent: Math.round(founderDepPercent * 100) / 100,
        creatorOwnedPercent: Math.round(creatorOwnedPercent * 100) / 100,
        revenueConcentrationRisk: Math.round(concentrationRisk * 100) / 100,
        platformDependencyScore: 50,
        monthlyRecurringRevenue: recurringMRR,
        mrrGrowthRate: 0,
        projectedAnnualRevenue: totalMRR * 12,
        ownedAssetCount: ownedAssets.length,
        revenueGeneratingAssets,
        totalOwnedAssetValue: totalAssetValue,
        lastComputedAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Error computing enterprise value metrics:', error);
    throw error;
  }
}

/**
 * Update specific metric
 */
export async function updateEnterpriseValueMetrics(
  talentId: string,
  data: Partial<EnterpriseValueMetricsInput>
) {
  try {
    return await prisma.enterpriseValueMetrics.upsert({
      where: { talentId },
      create: {
        talentId,
        ...data,
      } as any,
      update: data as any,
    });
  } catch (error) {
    console.error('Error updating enterprise value metrics:', error);
    throw error;
  }
}

/**
 * Get 12-month historical metrics (mock implementation)
 */
export async function getEnterpriseValueHistory(talentId: string, months: number = 12) {
  try {
    const current = await getEnterpriseValueMetrics(talentId);

    // For now, return current metrics with mock historical data
    // In production, this would query a time-series database or historical records
    const history: any[] = [];
    for (let i = months; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);

      const mrrValue = new Prisma.Decimal(Number(current.monthlyRecurringRevenue) * (1 - i * 0.02));
      
      history.push({
        id: current.id,
        updatedAt: current.updatedAt,
        talentId: current.talentId,
        recurringRevenuePercent: current.recurringRevenuePercent,
        founderDependentPercent: current.founderDependentPercent,
        creatorOwnedPercent: current.creatorOwnedPercent,
        revenueConcentrationRisk: current.revenueConcentrationRisk,
        platformDependencyScore: current.platformDependencyScore,
        monthlyRecurringRevenue: mrrValue,
        mrrGrowthRate: current.mrrGrowthRate,
        projectedAnnualRevenue: current.projectedAnnualRevenue,
        ownedAssetCount: current.ownedAssetCount,
        revenueGeneratingAssets: current.revenueGeneratingAssets,
        totalOwnedAssetValue: current.totalOwnedAssetValue,
        lastComputedAt: current.lastComputedAt,
        date
      });
    }

    return history;
  } catch (error) {
    console.error('Error getting enterprise value history:', error);
    throw error;
  }
}
