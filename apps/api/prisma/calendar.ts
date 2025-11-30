import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { createEventFromInbox, autoRSVP } from '../services/calendar/eventEngine.js';

const router = Router();

/**
 * GET /api/calendar/events
 * Fetches calendar events for a user.
 */
router.get('/events', async (req, res, next) => {
  try {
    // Assuming a userId is available on req.user in a real app
    const userId = 'clxrz45gn000008l4hy285p0g'; // Mock user
    const events = await prisma.talentEvent.findMany({
      where: { userId },
      orderBy: { startTime: 'asc' },
    });
    res.json(events);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/calendar/ai-extract
 * Extracts event info from an email without creating an event.
 */
router.post('/ai-extract', async (req, res, next) => {
  const { emailId } = req.body;
  try {
    const event = await createEventFromInbox(emailId);
    res.json(event);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/calendar/auto-rsvp
 * Generates an RSVP email for an event.
 */
router.post('/auto-rsvp', async (req, res, next) => {
  const { eventId, status, reason } = req.body;
  try {
    const rsvpEmail = await autoRSVP(eventId, status, reason);
    res.json(rsvpEmail);
  } catch (error) {
    next(error);
  }
});

export default router;