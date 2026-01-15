import prisma from '../lib/prisma.js';

export interface OutreachMetrics {
  totalOutreach: number;
  byStage: {
    [key: string]: number;
  };
  responseRate: number;
  conversionToMeetings: number;
  conversionToOpportunities: number;
  conversionToDeals: number;
  averageTimeToReply: number;
  pendingFollowUps: number;
  overdueFolowUps: number;
  topSources: Array<{ source: string; count: number }>;
  topTypes: Array<{ type: string; count: number }>;
}

/**
 * Calculate real metrics from actual database records
 * No placeholders - all numbers grounded in actual outreach data
 */
export async function calculateOutreachMetrics(
  filters?: {
    createdBy?: string;
    linkedBrandId?: string;
    archived?: boolean;
  }
): Promise<OutreachMetrics> {
  try {
    const where = {
      ...(filters?.createdBy && { createdBy: filters.createdBy }),
      ...(filters?.linkedBrandId && { linkedBrandId: filters.linkedBrandId }),
      ...(filters?.archived !== undefined && { archived: filters.archived }),
    };

    // Total outreach records
    const totalOutreach = await prisma.outreach.count({ where });

    // Outreach by stage
    const stageGroups = await prisma.outreach.groupBy({
      by: ['stage'],
      where,
      _count: true,
    });

    const byStage: { [key: string]: number } = {};
    stageGroups.forEach((group) => {
      byStage[group.stage] = group._count;
    });

    // Count outreach with replies
    const withReplies = await prisma.outreach.count({
      where: {
        ...where,
        emailsReplies: { gt: 0 },
      },
    });

    // Calculate response rate
    const responseRate = totalOutreach > 0 ? Math.round((withReplies / totalOutreach) * 100) : 0;

    // Count with meetings linked (check if any meetings exist for this outreach)
    // For now, we'll check by looking at associated tasks with "meeting" in the title
    const conversionToMeetings = await prisma.outreach.count({
      where: {
        ...where,
        OutreachNote: {
          some: {
            body: {
              contains: 'meeting',
              mode: 'insensitive',
            },
          },
        },
      },
    });

    // Count outreach with opportunity references
    const conversionToOpportunities = await prisma.outreach.count({
      where: {
        ...where,
        opportunityRef: { not: null },
      },
    });

    // Count outreach with linked opportunities that have deals
    const conversionToDeals = await prisma.salesOpportunity.count({
      where: {
        outreachId: {
          in: (
            await prisma.outreach.findMany({
              where,
              select: { id: true },
            })
          ).map((o) => o.id),
        },
        dealId: { not: null },
      },
    });

    // Calculate average time to first reply
    const outreachWithReplies = await prisma.outreach.findMany({
      where: {
        ...where,
        emailsReplies: { gt: 0 },
        lastContact: { not: null },
        createdAt: { not: null },
      },
      select: {
        createdAt: true,
        lastContact: true,
      },
    });

    let averageTimeToReply = 0;
    if (outreachWithReplies.length > 0) {
      const totalTime = outreachWithReplies.reduce((sum, o) => {
        const timeDiff = o.lastContact!.getTime() - o.createdAt.getTime();
        return sum + timeDiff;
      }, 0);
      averageTimeToReply = Math.round(totalTime / outreachWithReplies.length / (1000 * 60 * 60 * 24)); // in days
    }

    // Count pending follow-ups
    const now = new Date();
    const pendingFollowUps = await prisma.outreach.count({
      where: {
        ...where,
        nextFollowUp: {
          gt: now,
        },
        archived: false,
      },
    });

    // Count overdue follow-ups
    const overdueFolowUps = await prisma.outreach.count({
      where: {
        ...where,
        nextFollowUp: {
          lt: now,
        },
        archived: false,
      },
    });

    // Top sources
    const sourceGroups = await prisma.outreach.groupBy({
      by: ['source'],
      where: {
        ...where,
        source: { not: null },
      },
      _count: true,
      orderBy: { _count: { createdAt: 'desc' } },
      take: 5,
    });

    const topSources = sourceGroups
      .map((group) => ({
        source: group.source || 'Unknown',
        count: group._count,
      }))
      .filter((s) => s.count > 0);

    // Top types
    const typeGroups = await prisma.outreach.groupBy({
      by: ['type'],
      where,
      _count: true,
      orderBy: { _count: { createdAt: 'desc' } },
      take: 5,
    });

    const topTypes = typeGroups.map((group) => ({
      type: group.type,
      count: group._count,
    }));

    return {
      totalOutreach,
      byStage,
      responseRate,
      conversionToMeetings,
      conversionToOpportunities,
      conversionToDeals,
      averageTimeToReply,
      pendingFollowUps,
      overdueFolowUps,
      topSources,
      topTypes,
    };
  } catch (error) {
    console.error('Error calculating outreach metrics:', error);
    throw error;
  }
}

/**
 * Get detailed metrics for a specific outreach stage
 */
export async function getStageMetrics(stage: string) {
  try {
    const count = await prisma.outreach.count({
      where: { stage, archived: false },
    });

    const avgTimeInStage = await prisma.outreach.findMany({
      where: { stage, archived: false },
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const avgTime =
      avgTimeInStage.length > 0
        ? Math.round(
            avgTimeInStage.reduce((sum, o) => {
              return sum + (o.updatedAt.getTime() - o.createdAt.getTime());
            }, 0) / avgTimeInStage.length
          ) / (1000 * 60 * 60 * 24)
        : 0;

    return {
      stage,
      count,
      avgTimeInStageInDays: avgTime,
    };
  } catch (error) {
    console.error(`Error getting metrics for stage ${stage}:`, error);
    throw error;
  }
}
