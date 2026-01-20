import prisma from '../lib/prisma.js';

export interface CampaignReportContent {
  executiveSummary: string;
  campaignObjective: string;
  timeline: {
    start: string;
    end: string;
    status: string;
  };
  creatorsInvolved: {
    count: number;
    breakdown: {
      status: string;
      count: number;
    }[];
  };
  performance: {
    estimatedReach?: number;
    engagementMetrics?: string;
    highlights?: string[];
  };
  feedback: {
    brandFeedback: {
      positive: string[];
      concerns: string[];
    };
    approvalRate: number;
  };
  recommendations: string[];
  nextSteps: string[];
}

/**
 * Generate an AI-written campaign report
 * 
 * This service analyzes:
 * - Campaign details and objectives
 * - Creator shortlist approvals
 * - Brand feedback signals
 * - Performance (if available)
 * 
 * Report is BRAND-SAFE:
 * - No internal admin notes
 * - No creator earnings or risk ratings
 * - No pricing/cost information
 * - Focus on brand-facing metrics and learnings
 */
export async function generateCampaignReport(
  campaignId: string,
  userId: string
): Promise<CampaignReportContent> {
  try {
    // Fetch campaign with all related data
    const campaign = await prisma.crmCampaign.findUnique({
      where: { id: campaignId },
      include: {
        CreatorShortlist: {
          include: {
            Talent: {
              select: {
                id: true,
                name: true,
                SocialAccountConnection: {
                  where: { connected: true },
                  select: { platform: true }
                }
              }
            }
          }
        },
        CampaignFeedback: {
          select: {
            feedbackType: true,
            content: true,
            signals: true,
            submittedAt: true
          }
        }
      }
    }) as any;

    if (!campaign) {
      throw new Error(`Campaign ${campaignId} not found`);
    }

    // Analyze shortlist status
    const shortlistStats = {
      total: campaign.CreatorShortlist.length,
      approved: campaign.CreatorShortlist.filter(s => s.brandApprovalStatus === 'APPROVED').length,
      rejected: campaign.CreatorShortlist.filter(s => s.brandApprovalStatus === 'REJECTED').length,
      pending: campaign.CreatorShortlist.filter(s => s.brandApprovalStatus === 'PENDING_BRAND_APPROVAL').length,
      revisionRequested: campaign.CreatorShortlist.filter(s => s.brandApprovalStatus === 'REVISION_REQUESTED').length
    };

    const approvalRate = shortlistStats.total > 0 
      ? Math.round((shortlistStats.approved / shortlistStats.total) * 100)
      : 0;

    // Analyze feedback
    const brandFeedback = {
      positive: campaign.CampaignFeedback
        .filter(f => f.feedbackType === 'APPROVAL' || f.signals?.includes('approved_by_brand'))
        .map(f => f.content)
        .slice(0, 3),
      concerns: campaign.CampaignFeedback
        .filter(f => f.feedbackType === 'CONCERN' || f.feedbackType === 'REJECTION')
        .map(f => f.content)
        .slice(0, 3)
    };

    // Extract learning signals
    const allSignals = campaign.CampaignFeedback.flatMap(f => f.signals || []);
    const commonSignals = Object.entries(
      allSignals.reduce((acc, signal) => {
        acc[signal as string] = (acc[signal as string] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    )
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, 5)
      .map(([signal]) => signal);

    // Estimate reach (based on approved creators' follower counts)
    const estimatedReach = campaign.CreatorShortlist
      .filter(s => s.brandApprovalStatus === 'APPROVED')
      .length;

    // Build recommendations based on feedback patterns
    const recommendations: string[] = [];
    
    if (approvalRate < 50) {
      recommendations.push(
        'Consider refining creator selection criteria. Lower approval rate suggests potential mismatch between suggestions and brand preferences.'
      );
    }
    
    if (commonSignals.includes('audience_mismatch')) {
      recommendations.push(
        'Focus on audience demographics alignment in future campaigns. Brand flagged audience mismatch as a key concern.'
      );
    }
    
    if (commonSignals.includes('budget_constraint')) {
      recommendations.push(
        'Explore creators across different price points to maximize reach within budget constraints.'
      );
    }
    
    if (brandFeedback.positive.length > brandFeedback.concerns.length) {
      recommendations.push(
        'Maintain current selection strategy - brand showed strong approval patterns for this creator mix.'
      );
    }

    recommendations.push(
      'Review approved creators for campaign performance once deliverables are submitted.'
    );

    // Next steps
    const nextSteps: string[] = [];
    
    if (shortlistStats.approved > 0) {
      nextSteps.push(
        `Reach out to ${shortlistStats.approved} approved creator(s) to confirm participation and discuss deliverables.`
      );
    }
    
    if (shortlistStats.rejected > 0) {
      nextSteps.push(
        `Follow up with brand on ${shortlistStats.rejected} rejected creator(s) for feedback on alternatives.`
      );
    }
    
    if (shortlistStats.pending > 0 || shortlistStats.revisionRequested > 0) {
      nextSteps.push(
        `Resolve pending approvals (${shortlistStats.pending + shortlistStats.revisionRequested} pending)`
      );
    }
    
    nextSteps.push('Schedule campaign kick-off meeting once all creators confirmed.');

    // Generate report content
    const reportContent: CampaignReportContent = {
      executiveSummary: `Campaign "${campaign.campaignName}" shortlist curation completed with ${approvalRate}% brand approval rate. ${shortlistStats.approved} creator(s) approved for participation across ${campaign.platforms?.join(', ') || 'multiple platforms'}. Ready to proceed to outreach phase.`,
      
      campaignObjective: campaign.campaignObjective || campaign.campaignType || 'Not specified',
      
      timeline: {
        start: campaign.preferredStartDate?.toISOString().split('T')[0] || 'TBD',
        end: campaign.preferredEndDate?.toISOString().split('T')[0] || 'TBD',
        status: campaign.status || 'Active'
      },
      
      creatorsInvolved: {
        count: shortlistStats.total,
        breakdown: [
          { status: 'Approved', count: shortlistStats.approved },
          { status: 'Rejected', count: shortlistStats.rejected },
          { status: 'Pending Brand Review', count: shortlistStats.pending },
          { status: 'Revision Requested', count: shortlistStats.revisionRequested }
        ].filter(b => b.count > 0)
      },
      
      performance: {
        estimatedReach: estimatedReach > 0 ? estimatedReach : undefined,
        engagementMetrics: approvalRate > 0 
          ? `Brand approval rate: ${approvalRate}%` 
          : 'Awaiting brand feedback',
        highlights: [
          `Successfully curated ${shortlistStats.approved} creator(s) matching campaign objectives`,
          `${campaign.targetRegion?.length || 0} target region(s) covered: ${campaign.targetRegion?.join(', ') || 'Global'}`,
          campaign.budgetRange ? `Budget range: ${campaign.budgetRange}` : null
        ].filter(Boolean) as string[]
      },
      
      feedback: {
        brandFeedback,
        approvalRate
      },
      
      recommendations,
      nextSteps
    };

    return reportContent;

  } catch (error) {
    console.error('[CAMPAIGN REPORT SERVICE] Error generating report:', error);
    throw error;
  }
}

/**
 * Save campaign report to database
 */
export async function saveCampaignReport(
  campaignId: string,
  reportContent: CampaignReportContent,
  approvedByAdminId: string
) {
  try {
    // Check if report already exists
    const existingReport = await prisma.campaignReport.findUnique({
      where: { campaignId }
    });

    if (existingReport && existingReport.approvedAt) {
      throw new Error('Report already approved. Cannot overwrite approved reports.');
    }

    const report = await prisma.campaignReport.upsert({
      where: { campaignId },
      update: {
        reportContent: reportContent as any,
        approvedByAdminId,
        approvedAt: new Date()
      },
      create: {
        id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        campaignId,
        reportContent: reportContent as any,
        tone: 'PROFESSIONAL',
        generatedAt: new Date(),
        approvedByAdminId,
        approvedAt: new Date()
      }
    });

    // Log action
    await prisma.auditLog.create({
      data: {
        userId: approvedByAdminId,
        userRole: 'ADMIN',
        action: 'CAMPAIGN_REPORT_APPROVED',
        entityType: 'CampaignReport',
        entityId: report.id,
        metadata: {
          campaignId,
          reportSummary: reportContent.executiveSummary
        }
      }
    });

    return report;

  } catch (error) {
    console.error('[CAMPAIGN REPORT SERVICE] Error saving report:', error);
    throw error;
  }
}

/**
 * Release report to brand user
 */
export async function releaseCampaignReport(
  campaignId: string,
  approvedByAdminId: string
) {
  try {
    const report = await prisma.campaignReport.update({
      where: { campaignId },
      data: {
        releasedAt: new Date()
      }
    });

    // Log action
    await prisma.auditLog.create({
      data: {
        userId: approvedByAdminId,
        userRole: 'ADMIN',
        action: 'CAMPAIGN_REPORT_RELEASED_TO_BRAND',
        entityType: 'CampaignReport',
        entityId: report.id,
        metadata: { campaignId }
      }
    });

    return report;

  } catch (error) {
    console.error('[CAMPAIGN REPORT SERVICE] Error releasing report:', error);
    throw error;
  }
}
