import prisma from "../lib/prisma.js";
import { DealStage } from "@prisma/client";

/**
 * Revenue Calculation Service
 * 
 * Calculates revenue metrics from internal deal data without relying on payment processors.
 * All revenue is derived from Deal values and stages.
 * 
 * Revenue States:
 * - PROJECTED: Deals in negotiation or contract sent (potential revenue)
 * - CONTRACTED: Deals with signed contracts (committed but not yet paid)
 * - PAID: Manually marked as paid (actual realized revenue)
 */

// Deal stages mapped to revenue states
const PROJECTED_STAGES: DealStage[] = ["NEW_LEAD", "NEGOTIATION", "CONTRACT_SENT"];
const CONTRACTED_STAGES: DealStage[] = ["CONTRACT_SIGNED", "DELIVERABLES_IN_PROGRESS", "PAYMENT_PENDING"];
const PAID_STAGES: DealStage[] = ["PAYMENT_RECEIVED", "COMPLETED"];

interface RevenueBreakdown {
  projected: number;
  contracted: number;
  paid: number;
  total: number;
  dealCount: {
    projected: number;
    contracted: number;
    paid: number;
    total: number;
  };
}

interface BrandRevenueBreakdown extends RevenueBreakdown {
  brandId: string;
  brandName: string;
}

interface CreatorEarningsProjection {
  talentId: string;
  creatorName: string | null;
  projected: number;
  contracted: number;
  paid: number;
  total: number;
  dealCount: number;
  averageDealValue: number;
}

interface TimeSeriesDataPoint {
  date: string;
  projected: number;
  contracted: number;
  paid: number;
}

/**
 * Get overall revenue metrics across all deals
 */
export async function getRevenueMetrics(filters?: {
  startDate?: Date;
  endDate?: Date;
  brandId?: string;
  userId?: string;
}): Promise<RevenueBreakdown> {
  const where: any = {
    value: { not: null }
  };

  if (filters?.startDate || filters?.endDate) {
    where.createdAt = {};
    if (filters.startDate) where.createdAt.gte = filters.startDate;
    if (filters.endDate) where.createdAt.lte = filters.endDate;
  }

  if (filters?.brandId) {
    where.brandId = filters.brandId;
  }

  if (filters?.userId) {
    where.userId = filters.userId;
  }

  const deals = await prisma.deal.findMany({
    where,
    select: {
      id: true,
      value: true,
      stage: true,
      currency: true
    }
  });

  const projected = deals
    .filter(d => PROJECTED_STAGES.includes(d.stage))
    .reduce((sum, d) => sum + (d.value || 0), 0);

  const contracted = deals
    .filter(d => CONTRACTED_STAGES.includes(d.stage))
    .reduce((sum, d) => sum + (d.value || 0), 0);

  const paid = deals
    .filter(d => PAID_STAGES.includes(d.stage))
    .reduce((sum, d) => sum + (d.value || 0), 0);

  return {
    projected,
    contracted,
    paid,
    total: projected + contracted + paid,
    dealCount: {
      projected: deals.filter(d => PROJECTED_STAGES.includes(d.stage)).length,
      contracted: deals.filter(d => CONTRACTED_STAGES.includes(d.stage)).length,
      paid: deals.filter(d => PAID_STAGES.includes(d.stage)).length,
      total: deals.length
    }
  };
}

/**
 * Get revenue breakdown by brand
 */
export async function getRevenueByBrand(filters?: {
  startDate?: Date;
  endDate?: Date;
}): Promise<BrandRevenueBreakdown[]> {
  const where: any = {
    value: { not: null }
  };

  if (filters?.startDate || filters?.endDate) {
    where.createdAt = {};
    if (filters.startDate) where.createdAt.gte = filters.startDate;
    if (filters.endDate) where.createdAt.lte = filters.endDate;
  }

  const deals = await prisma.deal.findMany({
    where,
    select: {
      id: true,
      value: true,
      stage: true,
      brandId: true,
      Brand: {
        select: {
          name: true
        }
      }
    }
  });

  // Group by brand
  const brandMap = new Map<string, {
    brandName: string;
    deals: Array<{ value: number | null; stage: DealStage }>;
  }>();

  for (const deal of deals) {
    if (!brandMap.has(deal.brandId)) {
      brandMap.set(deal.brandId, {
        brandName: deal.Brand.name,
        deals: []
      });
    }
    brandMap.get(deal.brandId)!.deals.push({
      value: deal.value,
      stage: deal.stage
    });
  }

  // Calculate metrics for each brand
  const results: BrandRevenueBreakdown[] = [];
  
  for (const [brandId, data] of brandMap.entries()) {
    const projected = data.deals
      .filter(d => PROJECTED_STAGES.includes(d.stage))
      .reduce((sum, d) => sum + (d.value || 0), 0);

    const contracted = data.deals
      .filter(d => CONTRACTED_STAGES.includes(d.stage))
      .reduce((sum, d) => sum + (d.value || 0), 0);

    const paid = data.deals
      .filter(d => PAID_STAGES.includes(d.stage))
      .reduce((sum, d) => sum + (d.value || 0), 0);

    results.push({
      brandId,
      brandName: data.brandName,
      projected,
      contracted,
      paid,
      total: projected + contracted + paid,
      dealCount: {
        projected: data.deals.filter(d => PROJECTED_STAGES.includes(d.stage)).length,
        contracted: data.deals.filter(d => CONTRACTED_STAGES.includes(d.stage)).length,
        paid: data.deals.filter(d => PAID_STAGES.includes(d.stage)).length,
        total: data.deals.length
      }
    });
  }

  return results.sort((a, b) => b.total - a.total);
}

/**
 * Get creator earnings projections
 */
export async function getCreatorEarnings(filters?: {
  startDate?: Date;
  endDate?: Date;
  talentId?: string;
}): Promise<CreatorEarningsProjection[]> {
  const where: any = {
    value: { not: null }
  };

  if (filters?.startDate || filters?.endDate) {
    where.createdAt = {};
    if (filters.startDate) where.createdAt.gte = filters.startDate;
    if (filters.endDate) where.createdAt.lte = filters.endDate;
  }

  if (filters?.talentId) {
    where.talentId = filters.talentId;
  }

  const deals = await prisma.deal.findMany({
    where,
    select: {
      id: true,
      value: true,
      stage: true,
      talentId: true,
      Talent: {
        select: {
          User: {
            select: {
              name: true
            }
          }
        }
      }
    }
  });

  // Group by talent
  const talentMap = new Map<string, {
    creatorName: string | null;
    deals: Array<{ value: number | null; stage: DealStage }>;
  }>();

  for (const deal of deals) {
    if (!talentMap.has(deal.talentId)) {
      talentMap.set(deal.talentId, {
        creatorName: deal.Talent.User?.name || null,
        deals: []
      });
    }
    talentMap.get(deal.talentId)!.deals.push({
      value: deal.value,
      stage: deal.stage
    });
  }

  // Calculate metrics for each creator
  const results: CreatorEarningsProjection[] = [];
  
  for (const [talentId, data] of talentMap.entries()) {
    const projected = data.deals
      .filter(d => PROJECTED_STAGES.includes(d.stage))
      .reduce((sum, d) => sum + (d.value || 0), 0);

    const contracted = data.deals
      .filter(d => CONTRACTED_STAGES.includes(d.stage))
      .reduce((sum, d) => sum + (d.value || 0), 0);

    const paid = data.deals
      .filter(d => PAID_STAGES.includes(d.stage))
      .reduce((sum, d) => sum + (d.value || 0), 0);

    const total = projected + contracted + paid;
    const dealCount = data.deals.length;

    results.push({
      talentId,
      creatorName: data.creatorName,
      projected,
      contracted,
      paid,
      total,
      dealCount,
      averageDealValue: dealCount > 0 ? total / dealCount : 0
    });
  }

  return results.sort((a, b) => b.total - a.total);
}

/**
 * Get revenue time series data
 */
export async function getRevenueTimeSeries(filters?: {
  startDate?: Date;
  endDate?: Date;
  groupBy?: 'day' | 'week' | 'month';
}): Promise<TimeSeriesDataPoint[]> {
  const groupBy = filters?.groupBy || 'month';
  
  const where: any = {
    value: { not: null }
  };

  if (filters?.startDate || filters?.endDate) {
    where.createdAt = {};
    if (filters.startDate) where.createdAt.gte = filters.startDate;
    if (filters.endDate) where.createdAt.lte = filters.endDate;
  }

  const deals = await prisma.deal.findMany({
    where,
    select: {
      value: true,
      stage: true,
      createdAt: true,
      closedAt: true
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  // Group deals by time period
  const timeSeriesMap = new Map<string, {
    projected: number;
    contracted: number;
    paid: number;
  }>();

  for (const deal of deals) {
    const date = deal.closedAt || deal.createdAt;
    const key = formatDateKey(date, groupBy);

    if (!timeSeriesMap.has(key)) {
      timeSeriesMap.set(key, { projected: 0, contracted: 0, paid: 0 });
    }

    const bucket = timeSeriesMap.get(key)!;
    const value = deal.value || 0;

    if (PROJECTED_STAGES.includes(deal.stage)) {
      bucket.projected += value;
    } else if (CONTRACTED_STAGES.includes(deal.stage)) {
      bucket.contracted += value;
    } else if (PAID_STAGES.includes(deal.stage)) {
      bucket.paid += value;
    }
  }

  return Array.from(timeSeriesMap.entries())
    .map(([date, data]) => ({
      date,
      ...data
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Get brand-specific financial summary
 */
export async function getBrandFinancialSummary(brandId: string): Promise<BrandRevenueBreakdown> {
  const deals = await prisma.deal.findMany({
    where: {
      brandId,
      value: { not: null }
    },
    select: {
      id: true,
      value: true,
      stage: true,
      Brand: {
        select: {
          name: true
        }
      }
    }
  });

  const projected = deals
    .filter(d => PROJECTED_STAGES.includes(d.stage))
    .reduce((sum, d) => sum + (d.value || 0), 0);

  const contracted = deals
    .filter(d => CONTRACTED_STAGES.includes(d.stage))
    .reduce((sum, d) => sum + (d.value || 0), 0);

  const paid = deals
    .filter(d => PAID_STAGES.includes(d.stage))
    .reduce((sum, d) => sum + (d.value || 0), 0);

  return {
    brandId,
    brandName: deals[0]?.Brand.name || "Unknown",
    projected,
    contracted,
    paid,
    total: projected + contracted + paid,
    dealCount: {
      projected: deals.filter(d => PROJECTED_STAGES.includes(d.stage)).length,
      contracted: deals.filter(d => CONTRACTED_STAGES.includes(d.stage)).length,
      paid: deals.filter(d => PAID_STAGES.includes(d.stage)).length,
      total: deals.length
    }
  };
}

/**
 * Format date for time series grouping
 */
function formatDateKey(date: Date, groupBy: 'day' | 'week' | 'month'): string {
  const d = new Date(date);
  
  if (groupBy === 'day') {
    return d.toISOString().split('T')[0]; // YYYY-MM-DD
  } else if (groupBy === 'week') {
    const year = d.getFullYear();
    const week = getWeekNumber(d);
    return `${year}-W${week.toString().padStart(2, '0')}`;
  } else {
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    return `${year}-${month}`;
  }
}

/**
 * Get ISO week number
 */
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}
