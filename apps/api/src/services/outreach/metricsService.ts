import prisma from "../../lib/prisma.js";

/**
 * Centralized metrics calculation service for outreach operations
 * 
 * Metrics Definitions:
 * - "sent": Total outreach records created (not archived)
 * - "responded": Outreach records with emailsReplies > 0
 * - "meeting_booked": Outreach records that converted to SalesOpportunity
 * - "response_rate": (responded / sent) * 100
 * - "conversion_rate": (meeting_booked / sent) * 100
 * - "deal_conversion": (deals / opportunities) * 100
 */

interface MetricsFilter {
  owner?: string;
  startDate?: Date;
  endDate?: Date;
}

interface OutreachMetrics {
  totalOutreach: number;
  withReplies: number;
  responseRate: number;
  opportunities: number;
  deals: number;
  conversionToOpportunity: number;
  conversionToDeal: number;
  emailStats: {
    totalSent: number;
    totalReplies: number;
    avgSentPerOutreach: number;
    avgRepliesPerOutreach: number;
  };
}

interface PipelineStage {
  stage: string;
  count: number;
  records: Array<{
    id: string;
    target: string;
    status: string;
    lastContact: Date | null;
    nextFollowUp: Date | null;
    emailsSent: number;
    emailsReplies: number;
  }>;
}

interface PipelineData {
  pipeline: PipelineStage[];
  summary: {
    total: number;
    conversions: Array<{
      stage: string;
      count: number;
      percentage: number;
    }>;
  };
}

/**
 * Build Prisma where clause from metrics filter
 */
function buildWhereClause(filter: MetricsFilter) {
  const where: any = { archived: false };
  
  if (filter.owner) {
    where.owner = filter.owner;
  }
  
  if (filter.startDate || filter.endDate) {
    where.createdAt = {};
    if (filter.startDate) where.createdAt.gte = filter.startDate;
    if (filter.endDate) where.createdAt.lte = filter.endDate;
  }
  
  return where;
}

/**
 * Calculate comprehensive outreach metrics
 * 
 * @param filter - Optional filtering by owner, date range
 * @returns Complete metrics object with safe defaults
 */
export async function calculateOutreachMetrics(
  filter: MetricsFilter = {}
): Promise<OutreachMetrics> {
  try {
    const where = buildWhereClause(filter);

    const [
      totalOutreach,
      withReplies,
      opportunities,
      deals,
      emailStats
    ] = await Promise.all([
      // Total sent (not archived)
      prisma.outreach.count({ where }),
      
      // Responded (has at least one reply)
      prisma.outreach.count({ 
        where: { ...where, emailsReplies: { gt: 0 } } 
      }),
      
      // Meeting booked (converted to opportunity)
      prisma.salesOpportunity.count({
        where: {
          Outreach: where
        }
      }),
      
      // Closed deals
      prisma.deal.count({
        where: {
          Opportunity: {
            Outreach: where
          }
        }
      }),
      
      // Email statistics
      prisma.outreach.aggregate({
        where,
        _sum: {
          emailsSent: true,
          emailsReplies: true
        },
        _avg: {
          emailsSent: true,
          emailsReplies: true
        }
      })
    ]);

    // Calculate rates with safe division
    const responseRate = totalOutreach > 0 
      ? Math.round((withReplies / totalOutreach) * 100) 
      : 0;

    const conversionToOpportunity = totalOutreach > 0 
      ? Math.round((opportunities / totalOutreach) * 100) 
      : 0;

    const conversionToDeal = opportunities > 0 
      ? Math.round((deals / opportunities) * 100) 
      : 0;

    return {
      totalOutreach,
      withReplies,
      responseRate,
      opportunities,
      deals,
      conversionToOpportunity,
      conversionToDeal,
      emailStats: {
        totalSent: emailStats._sum.emailsSent || 0,
        totalReplies: emailStats._sum.emailsReplies || 0,
        avgSentPerOutreach: Math.round(emailStats._avg.emailsSent || 0),
        avgRepliesPerOutreach: Math.round(emailStats._avg.emailsReplies || 0)
      }
    };
  } catch (error) {
    console.error("[METRICS_CALCULATION] Error:", error);
    
    // Return safe defaults on error
    return {
      totalOutreach: 0,
      withReplies: 0,
      responseRate: 0,
      opportunities: 0,
      deals: 0,
      conversionToOpportunity: 0,
      conversionToDeal: 0,
      emailStats: {
        totalSent: 0,
        totalReplies: 0,
        avgSentPerOutreach: 0,
        avgRepliesPerOutreach: 0
      }
    };
  }
}

/**
 * Get pipeline data grouped by stage
 * 
 * @param filter - Optional filtering by owner, date range
 * @returns Pipeline stages with conversion percentages
 */
export async function calculatePipelineData(
  filter: MetricsFilter = {}
): Promise<PipelineData> {
  try {
    const where = buildWhereClause(filter);

    const grouped = await prisma.outreach.groupBy({
      by: ["stage"],
      where,
      _count: { id: true }
    });

    // Get detailed records for each stage
    const stageData = await Promise.all(
      grouped.map(async (g) => {
        const records = await prisma.outreach.findMany({
          where: { ...where, stage: g.stage },
          select: {
            id: true,
            target: true,
            status: true,
            lastContact: true,
            nextFollowUp: true,
            emailsSent: true,
            emailsReplies: true
          }
        });

        return {
          stage: g.stage,
          count: g._count.id,
          records
        };
      })
    );

    // Calculate conversion percentages
    const total = grouped.reduce((sum, g) => sum + g._count.id, 0);
    const conversions = stageData.map(s => ({
      stage: s.stage,
      count: s.count,
      percentage: total > 0 ? Math.round((s.count / total) * 100) : 0
    }));

    return {
      pipeline: stageData,
      summary: {
        total,
        conversions
      }
    };
  } catch (error) {
    console.error("[PIPELINE_CALCULATION] Error:", error);
    
    // Return safe defaults
    return {
      pipeline: [],
      summary: {
        total: 0,
        conversions: []
      }
    };
  }
}
