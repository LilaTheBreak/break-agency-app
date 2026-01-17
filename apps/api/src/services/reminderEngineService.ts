import prisma from '../lib/prisma.js';
import { logInfo, logError } from '../lib/logger.js';
import * as aiIntelligence from './aiIntelligenceService.js';

/**
 * Smart Reminder Engine
 * Generates AI-powered follow-up suggestions for talent
 * All suggestions are opt-in and require user approval
 */

/**
 * Analyze all context for a talent and generate smart reminders
 */
export async function generateSmartReminders(talentId: string): Promise<string[]> {
  try {
    logInfo('[REMINDER_ENGINE] Generating smart reminders', { talentId });

    const createdSuggestions: string[] = [];

    // Analyze recent meetings for follow-ups
    const recentMeetings = await prisma.meeting.findMany({
      where: {
        talentId,
        startTime: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
      select: { id: true, title: true },
    });

    for (const meeting of recentMeetings) {
      const followUpSuggestion = await aiIntelligence.analyzeMeetingForFollowUp(meeting.id);

      if (followUpSuggestion) {
        const suggestion = await prisma.smartReminderSuggestion.create({
          data: {
            talentId,
            contextType: 'meeting',
            contextId: meeting.id,
            suggestedAction: followUpSuggestion.suggestedAction,
            suggestedTiming: followUpSuggestion.suggestedTiming,
            reasoning: followUpSuggestion.reasoning,
            aiConfidence: followUpSuggestion.confidence,
            status: 'suggested',
          },
        });
        createdSuggestions.push(suggestion.id);
      }
    }

    // Analyze open outreach threads
    const openOutreach = await prisma.outreach.findMany({
      where: {
        linkedCreatorId: talentId,
        stage: { not: 'completed' },
      },
      select: { id: true, target: true },
    });

    for (const outreach of openOutreach) {
      const followUpSuggestion = await aiIntelligence.analyzeOutreachForFollowUp(outreach.id);

      if (followUpSuggestion) {
        const suggestion = await prisma.smartReminderSuggestion.create({
          data: {
            talentId,
            contextType: 'outreach',
            contextId: outreach.id,
            suggestedAction: followUpSuggestion.suggestedAction,
            suggestedTiming: followUpSuggestion.suggestedTiming,
            reasoning: followUpSuggestion.reasoning,
            aiConfidence: followUpSuggestion.confidence,
            status: 'suggested',
          },
        });
        createdSuggestions.push(suggestion.id);
      }
    }

    // Analyze open tasks
    const openTasks = await prisma.crmTask.findMany({
      where: {
        relatedCreators: { has: talentId },
        status: { not: 'Completed' },
      },
      select: { id: true, title: true },
    });

    for (const task of openTasks) {
      const followUpSuggestion = await aiIntelligence.analyzeTaskForFollowUp(task.id);

      if (followUpSuggestion) {
        const suggestion = await prisma.smartReminderSuggestion.create({
          data: {
            talentId,
            contextType: 'task',
            contextId: task.id,
            suggestedAction: followUpSuggestion.suggestedAction,
            suggestedTiming: followUpSuggestion.suggestedTiming,
            reasoning: followUpSuggestion.reasoning,
            aiConfidence: followUpSuggestion.confidence,
            status: 'suggested',
          },
        });
        createdSuggestions.push(suggestion.id);
      }
    }

    // Analyze active deals
    const activeDeals = await prisma.deal.findMany({
      where: { talentId },
      select: { id: true, stage: true },
    });

    for (const deal of activeDeals) {
      const followUpSuggestion = await aiIntelligence.analyzeDealForFollowUp(deal.id);

      if (followUpSuggestion) {
        const suggestion = await prisma.smartReminderSuggestion.create({
          data: {
            talentId,
            contextType: 'deal',
            contextId: deal.id,
            suggestedAction: followUpSuggestion.suggestedAction,
            suggestedTiming: followUpSuggestion.suggestedTiming,
            reasoning: followUpSuggestion.reasoning,
            aiConfidence: followUpSuggestion.confidence,
            status: 'suggested',
          },
        });
        createdSuggestions.push(suggestion.id);
      }
    }

    logInfo('[REMINDER_ENGINE] Generated smart reminders', {
      talentId,
      count: createdSuggestions.length,
    });

    return createdSuggestions;
  } catch (err) {
    logError('[REMINDER_ENGINE] Error generating reminders', err, { talentId });
    return [];
  }
}

/**
 * Get pending smart reminders for talent
 */
export async function getPendingReminders(talentId: string) {
  try {
    return await prisma.smartReminderSuggestion.findMany({
      where: {
        talentId,
        status: 'suggested',
      },
      orderBy: { suggestedTiming: 'asc' },
    });
  } catch (err) {
    logError('[REMINDER_ENGINE] Error fetching pending reminders', err, { talentId });
    return [];
  }
}

/**
 * Accept a reminder suggestion
 * Creates linked task if action requires one
 */
export async function acceptReminder(
  reminderId: string,
  linkedTaskId?: string
): Promise<{ success: boolean; taskId?: string }> {
  try {
    logInfo('[REMINDER_ENGINE] Accepting reminder', { reminderId, linkedTaskId });

    const reminder = await prisma.smartReminderSuggestion.findUnique({
      where: { id: reminderId },
    });

    if (!reminder) {
      return { success: false };
    }

    // Update reminder status
    await prisma.smartReminderSuggestion.update({
      where: { id: reminderId },
      data: {
        status: 'accepted',
        acceptedAt: new Date(),
        linkedTaskId: linkedTaskId || undefined,
      },
    });

    return { success: true, taskId: linkedTaskId };
  } catch (err) {
    logError('[REMINDER_ENGINE] Error accepting reminder', err, { reminderId });
    return { success: false };
  }
}

/**
 * Dismiss a reminder suggestion
 */
export async function dismissReminder(
  reminderId: string,
  reason: string
): Promise<{ success: boolean }> {
  try {
    logInfo('[REMINDER_ENGINE] Dismissing reminder', { reminderId, reason });

    await prisma.smartReminderSuggestion.update({
      where: { id: reminderId },
      data: {
        status: 'dismissed',
        dismissedAt: new Date(),
        dismissReason: reason,
      },
    });

    return { success: true };
  } catch (err) {
    logError('[REMINDER_ENGINE] Error dismissing reminder', err, { reminderId });
    return { success: false };
  }
}

/**
 * Get reminder details
 */
export async function getReminderDetails(reminderId: string) {
  try {
    const reminder = await prisma.smartReminderSuggestion.findUnique({
      where: { id: reminderId },
    });

    if (!reminder) {
      return null;
    }

    // Get context details
    let contextDetails: any = null;

    switch (reminder.contextType) {
      case 'meeting':
        contextDetails = await prisma.meeting.findUnique({
          where: { id: reminder.contextId },
          select: {
            id: true,
            title: true,
            startTime: true,
            endTime: true,
            notes: true,
          },
        });
        break;
      case 'task':
        contextDetails = await prisma.crmTask.findUnique({
          where: { id: reminder.contextId },
          select: {
            id: true,
            title: true,
            description: true,
            dueDate: true,
            priority: true,
          },
        });
        break;
      case 'deal':
        contextDetails = await prisma.deal.findUnique({
          where: { id: reminder.contextId },
          select: {
            id: true,
            stage: true,
            updatedAt: true,
          },
        });
        break;
      case 'outreach':
        contextDetails = await prisma.outreach.findUnique({
          where: { id: reminder.contextId },
          select: {
            id: true,
            target: true,
            stage: true,
            lastContact: true,
          },
        });
        break;
    }

    return {
      ...reminder,
      context: contextDetails,
    };
  } catch (err) {
    logError('[REMINDER_ENGINE] Error fetching reminder details', err, { reminderId });
    return null;
  }
}
