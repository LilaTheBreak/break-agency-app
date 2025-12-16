import prisma from '../../lib/prisma.js';
import { extractEventFromText } from '../ai/calendarExtractor.js';
import { detectClashes } from '../ai/clashDetector.js';
import { estimateTravelTime } from '../ai/travelEstimator.js';
import { generateRsvpEmail } from '../ai/rsvpGenerator.js';

/**
 * Creates a calendar event from an inbound email.
 */
export async function createEventFromInbox(emailId: string) {
  const email = await prisma.inboundEmail.findUnique({ where: { id: emailId } });
  if (!email || !email.body) throw new Error('Email not found or has no body.');

  const extracted = await extractEventFromText(email.body) as any;
  if (!extracted?.title || !extracted?.startTime) {
    console.log(`[EVENT ENGINE] No event found in email ${emailId}.`);
    return null;
  }

  const newEvent = await prisma.talentEvent.create({
    data: {
      userId: email.userId,
      title: extracted.title,
      description: extracted.description,
      startTime: new Date(extracted.startTime),
      endTime: new Date(extracted.endTime),
      location: extracted.location,
      source: 'inbox',
      sourceId: emailId,
    },
  });

  await detectAndSetClashes(newEvent);

  return newEvent;
}

/**
 * Detects clashes for a given event and updates the database.
 */
async function detectAndSetClashes(event: any) {
  const userEvents = await prisma.talentEvent.findMany({
    where: {
      userId: event.userId,
      startTime: { lt: new Date(event.endTime) },
      endTime: { gt: new Date(event.startTime) },
    },
  });

  const clashes = detectClashes(event, userEvents);
  if (clashes.length > 0) {
    await prisma.talentEvent.update({
      where: { id: event.id },
      data: { clashDetected: true },
    });
  }

  // Also estimate travel time if there's a location
  if (event.location) {
    const travelMinutes = await estimateTravelTime('Agency HQ', event.location);
    await prisma.talentEvent.update({
      where: { id: event.id },
      data: { travelTimeMinutes: travelMinutes },
    });
  }
}

/**
 * Generates an RSVP email for an event.
 */
export async function autoRSVP(eventId: string, status: 'accept' | 'decline', reason?: string) {
  const event = await prisma.talentEvent.findUnique({ where: { id: eventId } });
  if (!event) throw new Error('Event not found.');

  return generateRsvpEmail({ eventTitle: event.title, status, reason });
}