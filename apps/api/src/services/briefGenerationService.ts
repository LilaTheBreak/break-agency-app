import prisma from '../lib/prisma.js';
import { logInfo, logError } from '../lib/logger.js';
import * as aiIntelligence from './aiIntelligenceService.js';

/**
 * Weekly Brief Generation Service
 * Creates daily/weekly operational summaries for talent
 */

/**
 * Generate weekly brief for talent
 */
export async function generateWeeklyBrief(talentId: string, weekStart: Date) {
  try {
    logInfo('[BRIEF_GENERATOR] Generating weekly brief', { talentId, weekStart });

    // Calculate week end
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    // Check if brief already exists for this week
    const existingBrief = await prisma.talentWeeklyBrief.findUnique({
      where: {
        talentId_weekStartDate: {
          talentId,
          weekStartDate: weekStart,
        },
      },
    });

    if (existingBrief) {
      logInfo('[BRIEF_GENERATOR] Brief already exists for this week', { talentId });
      return existingBrief;
    }

    // Get brief content
    const briefContent = await aiIntelligence.generateWeeklyBriefContent(
      talentId,
      weekStart,
      weekEnd
    );

    // Create brief
    const brief = await prisma.talentWeeklyBrief.create({
      data: {
        talentId,
        weekStartDate: weekStart,
        weekEndDate: weekEnd,
        meetings: briefContent.meetings,
        upcomingTasks: briefContent.upcomingTasks,
        outstandingFollowUps: briefContent.outstandingFollowUps,
        dealsAtRisk: briefContent.dealsAtRisk,
        aiConcerns: briefContent.aiConcerns,
        urgencyLevel: briefContent.urgencyLevel,
      },
    });

    logInfo('[BRIEF_GENERATOR] Weekly brief created', { briefId: brief.id });
    return brief;
  } catch (err) {
    logError('[BRIEF_GENERATOR] Error generating weekly brief', err, { talentId });
    return null;
  }
}

/**
 * Get weekly brief for talent
 */
export async function getWeeklyBrief(talentId: string, weekStart: Date) {
  try {
    const brief = await prisma.talentWeeklyBrief.findUnique({
      where: {
        talentId_weekStartDate: {
          talentId,
          weekStartDate: weekStart,
        },
      },
    });

    return brief;
  } catch (err) {
    logError('[BRIEF_GENERATOR] Error fetching weekly brief', err, { talentId });
    return null;
  }
}

/**
 * Get recent briefs for talent
 */
export async function getRecentBriefs(talentId: string, limit: number = 4) {
  try {
    const briefs = await prisma.talentWeeklyBrief.findMany({
      where: { talentId },
      orderBy: { weekStartDate: 'desc' },
      take: limit,
    });

    return briefs;
  } catch (err) {
    logError('[BRIEF_GENERATOR] Error fetching recent briefs', err, { talentId });
    return [];
  }
}

/**
 * Mark brief as read
 */
export async function markBriefAsRead(briefId: string) {
  try {
    const brief = await prisma.talentWeeklyBrief.update({
      where: { id: briefId },
      data: {
        readAt: new Date(),
      },
    });

    return brief;
  } catch (err) {
    logError('[BRIEF_GENERATOR] Error marking brief as read', err, { briefId });
    return null;
  }
}

/**
 * Generate brief for all active talent
 * Usually run on weekly schedule
 */
export async function generateBriefsForAllTalent(weekStart: Date) {
  try {
    logInfo('[BRIEF_GENERATOR] Generating briefs for all talent', { weekStart });

    const talentList = await prisma.talent.findMany({
      select: { id: true },
    });

    const results = {
      success: 0,
      failed: 0,
      briefIds: [] as string[],
    };

    for (const talent of talentList) {
      try {
        const brief = await generateWeeklyBrief(talent.id, weekStart);
        if (brief) {
          results.success++;
          results.briefIds.push(brief.id);
        }
      } catch (err) {
        logError('[BRIEF_GENERATOR] Error generating brief for talent', err, {
          talentId: talent.id,
        });
        results.failed++;
      }
    }

    logInfo('[BRIEF_GENERATOR] Completed brief generation for all talent', results);
    return results;
  } catch (err) {
    logError('[BRIEF_GENERATOR] Error generating briefs for all talent', err);
    return {
      success: 0,
      failed: 0,
      briefIds: [],
    };
  }
}

/**
 * Get briefs by urgency level
 */
export async function getBriefsByUrgency(urgencyLevel: 'high' | 'normal') {
  try {
    const briefs = await prisma.talentWeeklyBrief.findMany({
      where: {
        urgencyLevel,
        readAt: null,
      },
      orderBy: { weekStartDate: 'desc' },
      include: {
        Talent: {
          select: { id: true, name: true },
        },
      },
    });

    return briefs;
  } catch (err) {
    logError('[BRIEF_GENERATOR] Error fetching briefs by urgency', err, { urgencyLevel });
    return [];
  }
}
