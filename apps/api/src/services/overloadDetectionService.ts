import prisma from '../lib/prisma.js';
import { logInfo, logError } from '../lib/logger.js';

/**
 * Calendar Overload Detection Service
 * Detects burnout signals: too many meetings, no buffer time, deadline clusters, availability conflicts
 * Creates calendar warnings that user can acknowledge
 */

interface OverloadAnalysis {
  overloadScore: number; // 0-100
  signals: string[];
  warnings: string[];
  recommendations: string[];
  severity: 'low' | 'medium' | 'high';
}

/**
 * Analyze calendar for overload signals
 */
export async function analyzeCalendarForOverload(
  talentId: string,
  dateStart: Date,
  dateEnd: Date
): Promise<OverloadAnalysis> {
  try {
    logInfo('[OVERLOAD_DETECTION] Analyzing calendar', { talentId, dateStart, dateEnd });

    const analysis: OverloadAnalysis = {
      overloadScore: 0,
      signals: [],
      warnings: [],
      recommendations: [],
      severity: 'low',
    };

    // Get talent's availability settings
    const availability = await prisma.talentAvailability.findUnique({
      where: { talentId },
    });

    // Get meetings for the date range (we'll use these for all analysis)
    const meetings = await prisma.meeting.findMany({
      where: {
        talentId,
        startTime: { gte: dateStart, lte: dateEnd },
      },
      orderBy: { startTime: 'asc' },
      select: { id: true, startTime: true, endTime: true, title: true },
    });

    if (meetings.length === 0) {
      return analysis;
    }

    // Check 1: Too many meetings per day
    const eventsByDay = groupEventsByDay(meetings);
    let maxEventsInDay = 0;
    let daysOverLimit = 0;

    const maxEventsPerDay = availability?.maxMeetingsPerDay || 6;

    Object.values(eventsByDay).forEach((dayEvents) => {
      if (dayEvents.length > maxEventsPerDay) {
        daysOverLimit++;
        maxEventsInDay = Math.max(maxEventsInDay, dayEvents.length);
      }
    });

    if (daysOverLimit > 0) {
      analysis.overloadScore += 20;
      analysis.signals.push(
        `${daysOverLimit} day(s) with more than ${maxEventsPerDay} meetings (max: ${maxEventsInDay})`
      );
      analysis.warnings.push('Multiple days are overbooked with too many meetings');
      analysis.recommendations.push(
        `Consider postponing non-critical meetings to reduce daily load`
      );
    }

    // Check 2: No buffer time between meetings
    let noBufferCount = 0;
    const minBuffer = (availability?.bufferBetweenMeetings || 15) * 60 * 1000; // Convert to ms

    for (let i = 0; i < meetings.length - 1; i++) {
      const endTime = meetings[i].endTime?.getTime() || meetings[i].startTime.getTime();
      const nextStartTime = meetings[i + 1].startTime.getTime();
      const bufferMs = nextStartTime - endTime;

      if (bufferMs < minBuffer) {
        noBufferCount++;
      }
    }

    if (noBufferCount > 2) {
      analysis.overloadScore += 25;
      analysis.signals.push(`${noBufferCount} consecutive meetings without adequate buffer`);
      analysis.warnings.push('Back-to-back meetings without prep time can reduce effectiveness');
      analysis.recommendations.push(
        'Block out 15-30 min between meetings for prep and mental recovery'
      );
    }

    // Check 3: Deadline/deliverable clusters
    const tasksInRange = await prisma.crmTask.findMany({
      where: {
        relatedCreators: { has: talentId },
        dueDate: { gte: dateStart, lte: dateEnd },
        status: { not: 'Completed' },
      },
    });

    const criticalTasks = tasksInRange.filter(
      (t) => t.priority === 'High' || t.priority === 'Critical'
    );

    if (criticalTasks.length > 5) {
      analysis.overloadScore += 20;
      analysis.signals.push(`${criticalTasks.length} high-priority tasks due in this period`);
      analysis.warnings.push('Multiple critical deliverables converging on same timeline');
      analysis.recommendations.push('Redistribute deadlines or delegate lower-priority items');
    }

    // Check 4: Availability conflicts (blackout dates)
    const blackoutDates = await prisma.talentBlackoutDate.findMany({
      where: {
        talentId,
        startDate: { lte: dateEnd },
        endDate: { gte: dateStart },
      },
    });

    if (blackoutDates.length > 0 && meetings.length > 0) {
      let conflictCount = 0;
      blackoutDates.forEach((blackout) => {
        conflictCount += meetings.filter(
          (m) =>
            m.startTime >= blackout.startDate &&
            m.startTime <= blackout.endDate
        ).length;
      });

      if (conflictCount > 0) {
        analysis.overloadScore += 30;
        analysis.signals.push(`${conflictCount} events scheduled during unavailable periods`);
        analysis.warnings.push('Calendar conflicts with declared unavailable time (vacation, illness, etc)');
        analysis.recommendations.push('Cancel or reschedule conflicting events immediately');
      }
    }

    // Calculate severity
    if (analysis.overloadScore >= 70) {
      analysis.severity = 'high';
    } else if (analysis.overloadScore >= 40) {
      analysis.severity = 'medium';
    } else {
      analysis.severity = 'low';
    }

    logInfo('[OVERLOAD_DETECTION] Analysis complete', {
      talentId,
      score: analysis.overloadScore,
      severity: analysis.severity,
    });

    return analysis;
  } catch (err) {
    logError('[OVERLOAD_DETECTION] Error analyzing calendar', err, { talentId });
    return {
      overloadScore: 0,
      signals: [],
      warnings: [],
      recommendations: [],
      severity: 'low',
    };
  }
}

/**
 * Create calendar warnings from overload analysis
 */
export async function createOverloadWarnings(
  talentId: string,
  analysis: OverloadAnalysis,
  calendarEventId?: string
): Promise<string[]> {
  try {
    logInfo('[OVERLOAD_DETECTION] Creating warnings', { talentId, severity: analysis.severity });

    const warningIds: string[] = [];

    if (analysis.severity === 'low') {
      return warningIds; // Don't create warnings for low severity
    }

    // Create warning for too many meetings
    if (analysis.signals[0]?.includes('day(s)')) {
      const warning = await prisma.calendarWarning.create({
        data: {
          talentId,
          eventId: calendarEventId,
          warningType: 'overload',
          severity: analysis.severity,
          message: analysis.warnings[0] || 'Calendar overload detected',
          aiAnalysis: `Multiple days overbooked. ${analysis.signals[0]}`,
          suggestedActions: analysis.recommendations,
        },
      });
      warningIds.push(warning.id);
    }

    // Create warning for no buffer
    if (analysis.signals.some((s) => s.includes('back-to-back'))) {
      const warning = await prisma.calendarWarning.create({
        data: {
          talentId,
          eventId: calendarEventId,
          warningType: 'no_buffer',
          severity: 'medium',
          message: 'Back-to-back meetings detected',
          aiAnalysis: analysis.signals.find((s) => s.includes('back-to-back')) || '',
          suggestedActions: ['Add buffer time between meetings for preparation'],
        },
      });
      warningIds.push(warning.id);
    }

    // Create warning for deadline cluster
    if (analysis.signals.some((s) => s.includes('high-priority tasks'))) {
      const warning = await prisma.calendarWarning.create({
        data: {
          talentId,
          eventId: calendarEventId,
          warningType: 'deadline_cluster',
          severity: 'high',
          message: 'Multiple critical deadlines converging',
          aiAnalysis: analysis.signals.find((s) => s.includes('high-priority')) || '',
          suggestedActions: [
            'Review deadline priorities',
            'Consider timeline adjustments',
            'Delegate if possible',
          ],
        },
      });
      warningIds.push(warning.id);
    }

    // Create warning for availability conflicts
    if (analysis.signals.some((s) => s.includes('unavailable periods'))) {
      const warning = await prisma.calendarWarning.create({
        data: {
          talentId,
          eventId: calendarEventId,
          warningType: 'availability_conflict',
          severity: 'high',
          message: 'Events scheduled during unavailable time',
          aiAnalysis: analysis.signals.find((s) => s.includes('unavailable')) || '',
          suggestedActions: [
            'Cancel conflicting events immediately',
            'Notify attendees of rescheduling',
          ],
        },
      });
      warningIds.push(warning.id);
    }

    logInfo('[OVERLOAD_DETECTION] Warnings created', { count: warningIds.length });
    return warningIds;
  } catch (err) {
    logError('[OVERLOAD_DETECTION] Error creating warnings', err, { talentId });
    return [];
  }
}

/**
 * Get active warnings for talent
 */
export async function getActiveWarnings(talentId: string) {
  try {
    const warnings = await prisma.calendarWarning.findMany({
      where: {
        talentId,
        dismissed: false,
      },
      orderBy: { createdAt: 'desc' },
    });

    return warnings;
  } catch (err) {
    logError('[OVERLOAD_DETECTION] Error fetching warnings', err, { talentId });
    return [];
  }
}

/**
 * Acknowledge warning
 */
export async function acknowledgeWarning(warningId: string) {
  try {
    const warning = await prisma.calendarWarning.update({
      where: { id: warningId },
      data: {
        acknowledgedAt: new Date(),
      },
    });

    return warning;
  } catch (err) {
    logError('[OVERLOAD_DETECTION] Error acknowledging warning', err, { warningId });
    return null;
  }
}

/**
 * Dismiss warning
 */
export async function dismissWarning(warningId: string) {
  try {
    const warning = await prisma.calendarWarning.update({
      where: { id: warningId },
      data: {
        dismissed: true,
        dismissedAt: new Date(),
      },
    });

    return warning;
  } catch (err) {
    logError('[OVERLOAD_DETECTION] Error dismissing warning', err, { warningId });
    return null;
  }
}

/**
 * Helper: Group meetings by day
 */
function groupEventsByDay(meetings: any[]): { [key: string]: any[] } {
  const grouped: { [key: string]: any[] } = {};

  meetings.forEach((meeting) => {
    const dayKey = meeting.startTime.toISOString().split('T')[0];
    if (!grouped[dayKey]) {
      grouped[dayKey] = [];
    }
    grouped[dayKey].push(meeting);
  });

  return grouped;
}
