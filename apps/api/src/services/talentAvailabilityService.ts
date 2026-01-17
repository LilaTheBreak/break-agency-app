import prisma from '../lib/prisma.js';
import { logInfo, logError } from '../lib/logger.js';

/**
 * Talent Availability & Blackout Management Service
 * Manages working hours, availability windows, and blackout dates
 */

/**
 * Set talent availability (working hours, timezone, buffers)
 */
export async function setTalentAvailability(
  talentId: string,
  availability: {
    workingDays: string[]; // ['MONDAY', 'TUESDAY', etc]
    startHour: number; // 9 (for 9 AM)
    endHour: number; // 17 (for 5 PM)
    timezone: string; // 'America/New_York'
    bufferBetweenMeetings?: number; // minutes
    maxMeetingsPerDay?: number;
    minPrepTimeMinutes?: number;
  }
) {
  try {
    logInfo('[AVAILABILITY_SERVICE] Setting talent availability', { talentId });

    // Check if availability already exists
    const existing = await prisma.talentAvailability.findUnique({
      where: { talentId },
    });

    let result;
    if (existing) {
      result = await prisma.talentAvailability.update({
        where: { talentId },
        data: {
          workingDays: availability.workingDays,
          startHour: availability.startHour,
          endHour: availability.endHour,
          timezone: availability.timezone,
          bufferBetweenMeetings: availability.bufferBetweenMeetings || 15,
          maxMeetingsPerDay: availability.maxMeetingsPerDay || 6,
          minPrepTimeMinutes: availability.minPrepTimeMinutes || 5,
        },
      });
    } else {
      result = await prisma.talentAvailability.create({
        data: {
          talentId,
          workingDays: availability.workingDays,
          startHour: availability.startHour,
          endHour: availability.endHour,
          timezone: availability.timezone,
          bufferBetweenMeetings: availability.bufferBetweenMeetings || 15,
          maxMeetingsPerDay: availability.maxMeetingsPerDay || 6,
          minPrepTimeMinutes: availability.minPrepTimeMinutes || 5,
        },
      });
    }

    logInfo('[AVAILABILITY_SERVICE] Availability set', { talentId });
    return result;
  } catch (err) {
    logError('[AVAILABILITY_SERVICE] Error setting availability', err, { talentId });
    return null;
  }
}

/**
 * Get talent availability
 */
export async function getTalentAvailability(talentId: string) {
  try {
    const availability = await prisma.talentAvailability.findUnique({
      where: { talentId },
    });

    // Return defaults if not set
    if (!availability) {
      return {
        talentId,
        workingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
        startHour: 9,
        endHour: 17,
        timezone: 'America/New_York',
        bufferBetweenMeetings: 15,
        maxMeetingsPerDay: 6,
        minPrepTimeMinutes: 5,
      };
    }

    return availability;
  } catch (err) {
    logError('[AVAILABILITY_SERVICE] Error fetching availability', err, { talentId });
    return null;
  }
}

/**
 * Check if talent is available at specific time
 */
export async function isAvailableAtTime(talentId: string, dateTime: Date): Promise<boolean> {
  try {
    // Get availability settings
    const availability = await getTalentAvailability(talentId);
    if (!availability) {
      return true; // Assume available if no settings
    }

    // Check if within working hours
    const hour = dateTime.getHours();
    if (hour < availability.startHour || hour >= availability.endHour) {
      return false; // Outside working hours
    }

    // Check if within working days
    const dayOfWeek = dateTime.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
    if (!availability.workingDays.includes(dayOfWeek)) {
      return false; // Not a working day
    }

    // Check for blackout dates
    const blackoutDates = await prisma.talentBlackoutDate.findMany({
      where: {
        talentId,
        startDate: { lte: dateTime },
        endDate: { gte: dateTime },
      },
    });

    if (blackoutDates.length > 0) {
      return false; // During blackout period
    }

    return true;
  } catch (err) {
    logError('[AVAILABILITY_SERVICE] Error checking availability', err, { talentId });
    return true; // Assume available on error
  }
}

/**
 * Add blackout date (vacation, illness, travel, etc)
 */
export async function addBlackoutDate(
  talentId: string,
  startDate: Date,
  endDate: Date,
  reason: string,
  notes?: string,
  visibleOnCalendar: boolean = true
) {
  try {
    logInfo('[AVAILABILITY_SERVICE] Adding blackout date', {
      talentId,
      startDate,
      endDate,
      reason,
    });

    const blackout = await prisma.talentBlackoutDate.create({
      data: {
        talentId,
        startDate,
        endDate,
        reason,
        notes: notes || '',
        visibleOnCalendar,
      },
    });

    logInfo('[AVAILABILITY_SERVICE] Blackout date created', { blackoutId: blackout.id });
    return blackout;
  } catch (err) {
    logError('[AVAILABILITY_SERVICE] Error adding blackout date', err, { talentId });
    return null;
  }
}

/**
 * Get blackout dates for talent
 */
export async function getBlackoutDates(
  talentId: string,
  startDate?: Date,
  endDate?: Date
) {
  try {
    const query: any = {
      where: { talentId },
      orderBy: { startDate: 'asc' },
    };

    if (startDate && endDate) {
      query.where.OR = [
        {
          startDate: { lte: endDate },
          endDate: { gte: startDate },
        },
      ];
    }

    const blackouts = await prisma.talentBlackoutDate.findMany(query);
    return blackouts;
  } catch (err) {
    logError('[AVAILABILITY_SERVICE] Error fetching blackout dates', err, { talentId });
    return [];
  }
}

/**
 * Remove blackout date
 */
export async function removeBlackoutDate(blackoutId: string) {
  try {
    logInfo('[AVAILABILITY_SERVICE] Removing blackout date', { blackoutId });

    await prisma.talentBlackoutDate.delete({
      where: { id: blackoutId },
    });

    logInfo('[AVAILABILITY_SERVICE] Blackout date removed', { blackoutId });
    return { success: true };
  } catch (err) {
    logError('[AVAILABILITY_SERVICE] Error removing blackout date', err, { blackoutId });
    return { success: false };
  }
}

/**
 * Find next available meeting slot for talent
 */
export async function findNextAvailableSlot(
  talentId: string,
  durationMinutes: number = 60,
  startAfter: Date = new Date(),
  maxDaysToSearch: number = 30
): Promise<{ start: Date; end: Date } | null> {
  try {
    logInfo('[AVAILABILITY_SERVICE] Finding available slot', {
      talentId,
      durationMinutes,
      startAfter,
    });

    const availability = await getTalentAvailability(talentId);
    if (!availability) {
      return null;
    }

    const durationMs = durationMinutes * 60 * 1000;
    let currentDate = new Date(startAfter);
    const searchUntil = new Date(startAfter);
    searchUntil.setDate(searchUntil.getDate() + maxDaysToSearch);

    while (currentDate < searchUntil) {
      // Check if it's a working day
      const dayOfWeek = currentDate.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
      if (!availability.workingDays.includes(dayOfWeek)) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }

      // Check for blackout dates
      const isBlackedOut = await isAvailableAtTime(talentId, currentDate);
      if (!isBlackedOut) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }

      // Try time slots throughout the day
      for (let hour = availability.startHour; hour < availability.endHour; hour++) {
        const slotStart = new Date(currentDate);
        slotStart.setHours(hour, 0, 0, 0);

        const slotEnd = new Date(slotStart);
        slotEnd.setTime(slotEnd.getTime() + durationMs);

        // Check if slot extends beyond working hours
        if (slotEnd.getHours() > availability.endHour) {
          continue;
        }

        // Check for conflicts with existing meetings
        const conflicts = await prisma.meeting.findMany({
          where: {
            talentId,
            startTime: { lt: slotEnd },
            endTime: { gt: slotStart },
          },
        });

        if (conflicts.length === 0) {
          logInfo('[AVAILABILITY_SERVICE] Available slot found', {
            talentId,
            start: slotStart,
            end: slotEnd,
          });
          return { start: slotStart, end: slotEnd };
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    logInfo('[AVAILABILITY_SERVICE] No available slot found', { talentId });
    return null;
  } catch (err) {
    logError('[AVAILABILITY_SERVICE] Error finding available slot', err, { talentId });
    return null;
  }
}

/**
 * Check meeting time against talent's availability
 */
export async function checkMeetingTimeValidity(
  talentId: string,
  startTime: Date,
  endTime: Date
): Promise<{
  isValid: boolean;
  issues: string[];
  warnings: string[];
}> {
  try {
    const result = {
      isValid: true,
      issues: [] as string[],
      warnings: [] as string[],
    };

    const availability = await getTalentAvailability(talentId);
    if (!availability) {
      return result;
    }

    // Check working hours
    if (startTime.getHours() < availability.startHour) {
      result.isValid = false;
      result.issues.push(
        `Meeting starts before working hours (${availability.startHour}:00)`
      );
    }

    if (endTime.getHours() > availability.endHour) {
      result.isValid = false;
      result.issues.push(`Meeting ends after working hours (${availability.endHour}:00)`);
    }

    // Check working days
    const dayOfWeek = startTime.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
    if (!availability.workingDays.includes(dayOfWeek)) {
      result.isValid = false;
      result.issues.push(`${dayOfWeek} is not a working day`);
    }

    // Check blackout dates
    const blackouts = await getBlackoutDates(talentId, startTime, endTime);
    if (blackouts.length > 0) {
      result.isValid = false;
      result.issues.push(
        `Meeting conflicts with blackout period: ${blackouts[0].reason}`
      );
    }

    // Check for buffer time with existing meetings
    const conflictingMeetings = await prisma.meeting.findMany({
      where: {
        talentId,
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
    });

    if (conflictingMeetings.length > 0) {
      result.isValid = false;
      result.issues.push(
        `Meeting conflicts with ${conflictingMeetings.length} existing meeting(s)`
      );
    }

    // Check buffer before/after
    const bufferMs = availability.bufferBetweenMeetings * 60 * 1000;
    const beforeMeeting = await prisma.meeting.findFirst({
      where: {
        talentId,
        endTime: {
          gt: new Date(startTime.getTime() - bufferMs),
          lt: startTime,
        },
      },
    });

    if (beforeMeeting) {
      result.warnings.push(
        `Less than ${availability.bufferBetweenMeetings} minutes before previous meeting`
      );
    }

    const afterMeeting = await prisma.meeting.findFirst({
      where: {
        talentId,
        startTime: {
          gt: endTime,
          lt: new Date(endTime.getTime() + bufferMs),
        },
      },
    });

    if (afterMeeting) {
      result.warnings.push(
        `Less than ${availability.bufferBetweenMeetings} minutes after this meeting`
      );
    }

    return result;
  } catch (err) {
    logError('[AVAILABILITY_SERVICE] Error checking meeting validity', err, { talentId });
    return {
      isValid: true,
      issues: [],
      warnings: [],
    };
  }
}
