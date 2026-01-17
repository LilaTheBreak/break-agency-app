import prisma from '../lib/prisma.js';
import { logInfo, logError } from '../lib/logger.js';

/**
 * Central AI Intelligence Service
 * Orchestrates all AI-driven suggestions and analysis
 * Does NOT make direct DB writes (only reads and returns suggestions)
 */

interface RemainderContext {
  talentId: string;
  contextType: 'meeting' | 'task' | 'deal' | 'outreach';
  contextId: string;
}

interface FollowUpSuggestion {
  suggestedAction: string;
  suggestedTiming: Date;
  reasoning: string;
  confidence: number;
}

/**
 * Analyze a meeting for follow-up opportunities
 */
export async function analyzeMeetingForFollowUp(
  meetingId: string
): Promise<FollowUpSuggestion | null> {
  try {
    logInfo('[AI_INTELLIGENCE] Analyzing meeting for follow-up', { meetingId });

    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: {
        actionItems: true,
        talent: {
          select: { id: true, name: true },
        },
      },
    });

    if (!meeting) {
      return null;
    }

    // Check if there are action items
    const hasActionItems = meeting.actionItems && meeting.actionItems.length > 0;
    
    if (!hasActionItems) {
      // Meeting held, no action items → suggest creating follow-up
      const suggestedTiming = new Date(meeting.endTime || meeting.startTime);
      suggestedTiming.setDate(suggestedTiming.getDate() + 3); // 3 days later

      return {
        suggestedAction: 'Schedule follow-up meeting to discuss outcomes and next steps',
        suggestedTiming,
        reasoning: `Meeting "${meeting.title}" held but no action items were created. Follow-up recommended to ensure alignment and accountability.`,
        confidence: 0.8,
      };
    }

    // Check for overdue action items
    const overdueItems = meeting.actionItems.filter(
      (item) => item.dueDate && item.dueDate < new Date() && item.status !== 'completed'
    );

    if (overdueItems.length > 0) {
      return {
        suggestedAction: 'Check status of overdue action items from meeting',
        suggestedTiming: new Date(),
        reasoning: `${overdueItems.length} action item(s) from "${meeting.title}" are overdue. Follow-up recommended.`,
        confidence: 0.9,
      };
    }

    return null;
  } catch (err) {
    logError('[AI_INTELLIGENCE] Error analyzing meeting', err, { meetingId });
    return null;
  }
}

/**
 * Analyze outreach thread for follow-up opportunities
 */
export async function analyzeOutreachForFollowUp(
  outreachId: string
): Promise<FollowUpSuggestion | null> {
  try {
    logInfo('[AI_INTELLIGENCE] Analyzing outreach for follow-up', { outreachId });

    // Check if outreach has been contacted
    const outreach = await prisma.outreach.findUnique({
      where: { id: outreachId },
    });

    if (!outreach) {
      return null;
    }

    // Check if no contact in last N days
    const lastContactDate = outreach.lastContact || outreach.createdAt;
    const daysSinceContact = Math.floor(
      (new Date().getTime() - lastContactDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceContact >= 5 && outreach.stage !== 'completed') {
      const suggestedTiming = new Date();
      suggestedTiming.setDate(suggestedTiming.getDate() + 1); // Tomorrow

      return {
        suggestedAction: 'Follow up on outreach - no response in 5+ days',
        suggestedTiming,
        reasoning: `No contact with ${outreach.target} in ${daysSinceContact} days. Follow-up recommended to keep conversation active.`,
        confidence: 0.85,
      };
    }

    return null;
  } catch (err) {
    logError('[AI_INTELLIGENCE] Error analyzing outreach', err, { outreachId });
    return null;
  }
}

/**
 * Analyze task for follow-up opportunities
 */
export async function analyzeTaskForFollowUp(taskId: string): Promise<FollowUpSuggestion | null> {
  try {
    logInfo('[AI_INTELLIGENCE] Analyzing task for follow-up', { taskId });

    const task = await prisma.crmTask.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return null;
    }

    // Check if task is overdue
    if (task.dueDate && task.dueDate < new Date() && task.status !== 'Completed') {
      return {
        suggestedAction: 'Complete or reschedule overdue task',
        suggestedTiming: new Date(),
        reasoning: `Task "${task.title}" is overdue since ${task.dueDate.toLocaleDateString()}. Immediate action recommended.`,
        confidence: 0.95,
      };
    }

    // Check if task is due soon
    const daysUntilDue = task.dueDate
      ? Math.floor((task.dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      : null;

    if (daysUntilDue && daysUntilDue <= 3 && daysUntilDue > 0 && task.status !== 'Completed') {
      return {
        suggestedAction: 'Prepare and complete task due soon',
        suggestedTiming: new Date(),
        reasoning: `Task "${task.title}" is due in ${daysUntilDue} day(s). Start preparation now.`,
        confidence: 0.8,
      };
    }

    return null;
  } catch (err) {
    logError('[AI_INTELLIGENCE] Error analyzing task', err, { taskId });
    return null;
  }
}

/**
 * Analyze deal for follow-up opportunities
 */
export async function analyzeDealForFollowUp(dealId: string): Promise<FollowUpSuggestion | null> {
  try {
    logInfo('[AI_INTELLIGENCE] Analyzing deal for follow-up', { dealId });

    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      select: {
        id: true,
        stage: true,
        updatedAt: true,
        brandName: true,
        talentId: true,
      },
    });

    if (!deal) {
      return null;
    }

    // Get talent name separately if needed
    let talentName = '';
    if (deal.talentId) {
      const talent = await prisma.talent.findUnique({
        where: { id: deal.talentId },
        select: { name: true },
      });
      talentName = talent?.name || '';
    }

    // Check if deal is in proposal stage and no activity
    const lastActivityDate = deal.updatedAt;
    const daysSinceActivity = Math.floor(
      (new Date().getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (
      ['PROPOSAL_SENT', 'AWAITING_RESPONSE'].includes(deal.stage as string) &&
      daysSinceActivity >= 7
    ) {
      const suggestedTiming = new Date();
      suggestedTiming.setDate(suggestedTiming.getDate() + 1);

      return {
        suggestedAction: 'Follow up on pending deal proposal',
        suggestedTiming,
        reasoning: `Deal with ${deal.brandName} for ${talentName} has been in "${deal.stage}" for ${daysSinceActivity} days without response. Follow-up recommended.`,
        confidence: 0.8,
      };
    }

    return null;
  } catch (err) {
    logError('[AI_INTELLIGENCE] Error analyzing deal', err, { dealId });
    return null;
  }
}

/**
 * Generate meeting agenda from context
 * Uses talent profile, recent deals, open tasks, previous meetings, outreach threads
 */
export async function generateMeetingAgenda(meetingId: string): Promise<{
  objectives: string[];
  talkingPoints: string[];
  decisionsNeeded: string[];
  prepItems: string[];
}> {
  try {
    logInfo('[AI_INTELLIGENCE] Generating meeting agenda', { meetingId });

    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: {
        talent: {
          select: {
            id: true,
            name: true,
            categories: true,
          },
        },
      },
    });

    if (!meeting) {
      return {
        objectives: [],
        talkingPoints: [],
        decisionsNeeded: [],
        prepItems: [],
      };
    }

    // Get talent's recent deals
    const deals = await prisma.deal.findMany({
      where: { talentId: meeting.talentId },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      select: { id: true, stage: true, updatedAt: true },
    });

    // Get talent's open tasks
    const tasks = await prisma.crmTask.findMany({
      where: {
        relatedCreators: { has: meeting.talentId },
        status: { not: 'Completed' },
      },
      orderBy: { dueDate: 'asc' },
      take: 5,
    });

    // Generate agenda based on context
    const objectives: string[] = [];
    const talkingPoints: string[] = [];
    const decisionsNeeded: string[] = [];
    const prepItems: string[] = [];

    // Add deal-based agenda items
    if (deals.length > 0) {
      const activeDeals = deals.filter((d) =>
        ['NEGOTIATING', 'PROPOSAL_SENT', 'AWAITING_RESPONSE'].includes(d.stage as string)
      );
      if (activeDeals.length > 0) {
        objectives.push(`Discuss progress on ${activeDeals.length} active deal(s)`);
        activeDeals.forEach((deal) => {
          talkingPoints.push(`Review ${deal.stage} status for deal`);
          decisionsNeeded.push(`Confirm next steps for deal`);
        });
      }
    }

    // Add task-based agenda items
    if (tasks.length > 0) {
      objectives.push(`Review and update task status (${tasks.length} open tasks)`);
      tasks.forEach((task) => {
        prepItems.push(`Check status of "${task.title}" (due ${task.dueDate?.toLocaleDateString()})`);
      });
    }

    // Add meeting-specific item
    objectives.push(`Clarify objectives and outcomes for this meeting`);
    talkingPoints.push('Confirm meeting purpose and expected outcomes');

    return {
      objectives,
      talkingPoints,
      decisionsNeeded,
      prepItems,
    };
  } catch (err) {
    logError('[AI_INTELLIGENCE] Error generating agenda', err, { meetingId });
    return {
      objectives: [],
      talkingPoints: [],
      decisionsNeeded: [],
      prepItems: [],
    };
  }
}

/**
 * Summarize week for talent
 * Returns meetings, tasks, deals, alerts, AI-flagged concerns
 */
export async function generateWeeklyBriefContent(
  talentId: string,
  weekStart: Date,
  weekEnd: Date
): Promise<{
  meetings: any[];
  upcomingTasks: any[];
  outstandingFollowUps: any[];
  dealsAtRisk: any[];
  aiConcerns: any[];
  urgencyLevel: string;
}> {
  try {
    logInfo('[AI_INTELLIGENCE] Generating weekly brief', { talentId, weekStart, weekEnd });

    const meetings = await prisma.meeting.findMany({
      where: {
        talentId,
        startTime: { gte: weekStart, lte: weekEnd },
      },
      select: {
        id: true,
        title: true,
        startTime: true,
        endTime: true,
        meetingType: true,
      },
      orderBy: { startTime: 'asc' },
    });

    const upcomingTasks = await prisma.crmTask.findMany({
      where: {
        relatedCreators: { has: talentId },
        dueDate: { gte: weekStart, lte: weekEnd },
        status: { not: 'Completed' },
      },
      select: {
        id: true,
        title: true,
        dueDate: true,
        priority: true,
        status: true,
      },
      orderBy: { dueDate: 'asc' },
    });

    const deals = await prisma.deal.findMany({
      where: { talentId },
      select: {
        id: true,
        stage: true,
        updatedAt: true,
      },
    });

    const atRiskDeals = deals.filter((d) =>
      ['NEGOTIATING', 'PROPOSAL_SENT', 'AWAITING_RESPONSE'].includes(d.stage as string)
    );

    const outstandingFollowUps: any[] = [];
    const aiConcerns: any[] = [];

    // Check for overdue tasks
    const overdueTasks = await prisma.crmTask.findMany({
      where: {
        relatedCreators: { has: talentId },
        dueDate: { lt: new Date() },
        status: { not: 'Completed' },
      },
      take: 5,
    });

    if (overdueTasks.length > 0) {
      aiConcerns.push({
        concern: `${overdueTasks.length} overdue task(s)`,
        severity: 'high',
        recommendation: 'Prioritize completing overdue tasks immediately',
      });
    }

    const urgencyLevel =
      overdueTasks.length > 0 || atRiskDeals.length > 3 ? 'high' : 'normal';

    return {
      meetings: meetings.map((m) => ({
        title: m.title,
        date: m.startTime,
        type: m.meetingType,
      })),
      upcomingTasks: upcomingTasks.map((t) => ({
        title: t.title,
        dueDate: t.dueDate,
        priority: t.priority,
      })),
      outstandingFollowUps,
      dealsAtRisk: atRiskDeals.map((d) => ({
        stage: d.stage,
        daysInStage: Math.floor(
          (new Date().getTime() - d.updatedAt.getTime()) / (1000 * 60 * 60 * 24)
        ),
      })),
      aiConcerns,
      urgencyLevel,
    };
  } catch (err) {
    logError('[AI_INTELLIGENCE] Error generating brief content', err, { talentId });
    return {
      meetings: [],
      upcomingTasks: [],
      outstandingFollowUps: [],
      dealsAtRisk: [],
      aiConcerns: [],
      urgencyLevel: 'normal',
    };
  }
}
