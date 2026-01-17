import prisma from '../lib/prisma.js';
import { logInfo, logError } from '../lib/logger.js';
import * as aiIntelligence from './aiIntelligenceService.js';

/**
 * Meeting Agenda Generation Service
 * Auto-generates context-aware, user-editable meeting agendas
 */

/**
 * Generate agenda for meeting
 */
export async function generateMeetingAgenda(meetingId: string) {
  try {
    logInfo('[AGENDA_SERVICE] Generating agenda for meeting', { meetingId });

    // Check if agenda already exists
    const existing = await prisma.meetingAgenda.findUnique({
      where: { meetingId },
    });

    if (existing) {
      logInfo('[AGENDA_SERVICE] Agenda already exists', { meetingId });
      return existing;
    }

    // Generate agenda content using AI intelligence
    const agendaContent = await aiIntelligence.generateMeetingAgenda(meetingId);

    if (!agendaContent || agendaContent.objectives.length === 0) {
      logInfo('[AGENDA_SERVICE] No agenda content generated', { meetingId });
      return null;
    }

    // Create agenda in database
    const agenda = await prisma.meetingAgenda.create({
      data: {
        meetingId,
        objectives: JSON.stringify(agendaContent.objectives),
        talkingPoints: JSON.stringify(agendaContent.talkingPoints),
        decisionsNeeded: JSON.stringify(agendaContent.decisionsNeeded),
        prepItems: JSON.stringify(agendaContent.prepItems),
        isEdited: false,
        generatedBy: 'ai',
      },
    });

    logInfo('[AGENDA_SERVICE] Agenda generated', { agendaId: agenda.id });
    return agenda;
  } catch (err) {
    logError('[AGENDA_SERVICE] Error generating agenda', err, { meetingId });
    return null;
  }
}

/**
 * Get agenda for meeting
 */
export async function getAgenda(meetingId: string) {
  try {
    const agenda = await prisma.meetingAgenda.findUnique({
      where: { meetingId },
    });

    if (!agenda) {
      return null;
    }

    // Get the meeting separately
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      select: {
        id: true,
        title: true,
        startTime: true,
        endTime: true,
        talent: { select: { id: true, name: true } },
      },
    });

    return {
      ...agenda,
      Meeting: meeting,
    };
  } catch (err) {
    logError('[AGENDA_SERVICE] Error fetching agenda', err, { meetingId });
    return null;
  }
}

/**
 * Update agenda (user edits)
 */
export async function updateAgenda(
  meetingId: string,
  updates: {
    objectives?: string[];
    talkingPoints?: string[];
    decisionsNeeded?: string[];
    prepItems?: string[];
  }
) {
  try {
    logInfo('[AGENDA_SERVICE] Updating agenda', { meetingId });

    const agenda = await prisma.meetingAgenda.update({
      where: { meetingId },
      data: {
        objectives: updates.objectives ? JSON.stringify(updates.objectives) : undefined,
        talkingPoints: updates.talkingPoints ? JSON.stringify(updates.talkingPoints) : undefined,
        decisionsNeeded: updates.decisionsNeeded ? JSON.stringify(updates.decisionsNeeded) : undefined,
        prepItems: updates.prepItems ? JSON.stringify(updates.prepItems) : undefined,
        isEdited: true,
        editedAt: new Date(),
      },
    });

    logInfo('[AGENDA_SERVICE] Agenda updated', { meetingId });
    return agenda;
  } catch (err) {
    logError('[AGENDA_SERVICE] Error updating agenda', err, { meetingId });
    return null;
  }
}

/**
 * Add objective to agenda
 */
export async function addObjective(meetingId: string, objective: string) {
  try {
    const agenda = await getAgenda(meetingId);
    if (!agenda) {
      return null;
    }

    const objectives = agenda.objectives 
      ? [...(JSON.parse(agenda.objectives)), objective]
      : [objective];

    return await updateAgenda(meetingId, { objectives });
  } catch (err) {
    logError('[AGENDA_SERVICE] Error adding objective', err, { meetingId });
    return null;
  }
}

/**
 * Remove objective from agenda
 */
export async function removeObjective(meetingId: string, objective: string) {
  try {
    const agenda = await getAgenda(meetingId);
    if (!agenda) {
      return null;
    }

    const objectives = agenda.objectives 
      ? (JSON.parse(agenda.objectives) as string[]).filter((o) => o !== objective)
      : [];
      
    return await updateAgenda(meetingId, { objectives });
  } catch (err) {
    logError('[AGENDA_SERVICE] Error removing objective', err, { meetingId });
    return null;
  }
}

/**
 * Add talking point
 */
export async function addTalkingPoint(meetingId: string, point: string) {
  try {
    const agenda = await getAgenda(meetingId);
    if (!agenda) {
      return null;
    }

    const talkingPoints = Array.isArray(agenda.talkingPoints)
      ? [...agenda.talkingPoints, point]
      : [point];

    return await updateAgenda(meetingId, { talkingPoints });
  } catch (err) {
    logError('[AGENDA_SERVICE] Error adding talking point', err, { meetingId });
    return null;
  }
}

/**
 * Add decision needed
 */
export async function addDecisionNeeded(meetingId: string, decision: string) {
  try {
    const agenda = await getAgenda(meetingId);
    if (!agenda) {
      return null;
    }

    const decisionsNeeded = Array.isArray(agenda.decisionsNeeded)
      ? [...agenda.decisionsNeeded, decision]
      : [decision];

    return await updateAgenda(meetingId, { decisionsNeeded });
  } catch (err) {
    logError('[AGENDA_SERVICE] Error adding decision', err, { meetingId });
    return null;
  }
}

/**
 * Add prep item
 */
export async function addPrepItem(meetingId: string, item: string) {
  try {
    const agenda = await getAgenda(meetingId);
    if (!agenda) {
      return null;
    }

    const prepItems = Array.isArray(agenda.prepItems) ? [...agenda.prepItems, item] : [item];

    return await updateAgenda(meetingId, { prepItems });
  } catch (err) {
    logError('[AGENDA_SERVICE] Error adding prep item', err, { meetingId });
    return null;
  }
}

/**
 * Regenerate agenda (user requests fresh AI generation)
 */
export async function regenerateAgenda(meetingId: string) {
  try {
    logInfo('[AGENDA_SERVICE] Regenerating agenda', { meetingId });

    // Get existing agenda
    const agenda = await prisma.meetingAgenda.findUnique({
      where: { meetingId },
    });

    // Generate fresh content
    const agendaContent = await aiIntelligence.generateMeetingAgenda(meetingId);

    if (!agendaContent) {
      return agenda;
    }

    // Update with fresh content (reset isEdited flag)
    const updated = await prisma.meetingAgenda.update({
      where: { meetingId },
      data: {
        objectives: JSON.stringify(agendaContent.objectives),
        talkingPoints: JSON.stringify(agendaContent.talkingPoints),
        decisionsNeeded: JSON.stringify(agendaContent.decisionsNeeded),
        prepItems: JSON.stringify(agendaContent.prepItems),
        isEdited: false,
        editedAt: null,
        generatedBy: 'ai',
      },
    });

    logInfo('[AGENDA_SERVICE] Agenda regenerated', { meetingId });
    return updated;
  } catch (err) {
    logError('[AGENDA_SERVICE] Error regenerating agenda', err, { meetingId });
    return null;
  }
}

/**
 * Get all agendas for meetings on specific day
 */
export async function getAgendasByDate(talentId: string, date: Date) {
  try {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    // Get meetings first
    const meetings = await prisma.meeting.findMany({
      where: {
        talentId,
        startTime: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
      select: { id: true, title: true, startTime: true, endTime: true },
      orderBy: { startTime: 'asc' },
    });

    const meetingIds = meetings.map((m) => m.id);

    // Then get agendas for those meetings
    const agendas = await prisma.meetingAgenda.findMany({
      where: {
        meetingId: { in: meetingIds },
      },
    });

    // Combine agendas with meeting info
    return agendas.map((agenda) => ({
      ...agenda,
      Meeting: meetings.find((m) => m.id === agenda.meetingId),
    }));
  } catch (err) {
    logError('[AGENDA_SERVICE] Error fetching agendas by date', err, { talentId });
    return [];
  }
}
