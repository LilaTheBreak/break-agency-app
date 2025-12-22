import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import prisma from "../lib/prisma.js";
import { z } from "zod";
import { getGoogleCalendarClient, syncGoogleCalendarEvents } from "../lib/google.js";

const router = Router();

// All routes require authentication
router.use(requireAuth);

/**
 * GET /events
 * Fetches all calendar events for the logged-in user.
 * Also triggers a Google Calendar sync if an account is linked.
 */
router.get("/events", async (req: Request, res: Response) => {
  const userId = req.user!.id;

  try {
    // First, try to sync with Google Calendar in the background (don't block response)
    getGoogleCalendarClient(userId)
      .then(async (gcal) => {
        if (gcal) {
          console.log(`Syncing Google Calendar for user ${userId}...`);
          await syncGoogleCalendarEvents(userId, gcal);
          console.log(`Sync complete for user ${userId}.`);
        }
      })
      .catch(err => console.error("Background Google Calendar sync failed:", err));

    // Fetch all events from the local database
    const events = await prisma.talentEvent.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        startTime: "asc",
      },
    });

    res.json({ success: true, data: { events } });
  } catch (error) {
    console.error("Failed to fetch calendar events:", error);
    res.status(500).json({ success: false, error: "Could not load calendar events." });
  }
});

const EventCreateSchema = z.object({
  title: z.string().min(1),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  isAllDay: z.boolean().optional(),
  location: z.string().optional(),
  category: z.string().optional(), // For color-coding
  description: z.string().optional(),
});

/**
 * POST /events
 * Creates a new calendar event.
 */
router.post("/events", async (req: Request, res: Response) => {
  const parsed = EventCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: "Invalid payload.", details: parsed.error.flatten() });
  }

  try {
    const userId = req.user!.id;
    const talent = await prisma.talent.findUnique({ where: { userId } });

    const newEvent = await prisma.talentEvent.create({
      data: {
        ...parsed.data,
        userId: userId,
        talentId: talent?.id || null,
        source: "manual", // Indicates it was created within the app
        metadata: {
          category: parsed.data.category || 'general'
        }
      },
    });

    res.status(201).json({ success: true, data: { event: newEvent } });
  } catch (error) {
    console.error("Failed to create calendar event:", error);
    res.status(500).json({ success: false, error: "Could not create event." });
  }
});

/**
 * DELETE /events/:id
 * Deletes a calendar event.
 */
router.delete("/events/:id", async (req: Request, res: Response) => {
  try {
    const eventId = req.params.id;
    const userId = req.user!.id;

    // Ensure the user can only delete their own events
    const eventToDelete = await prisma.talentEvent.findFirst({
      where: { id: eventId, userId: userId },
    });

    if (!eventToDelete) {
      return res.status(404).json({ success: false, error: "Event not found or you do not have permission to delete it." });
    }

    await prisma.talentEvent.delete({ where: { id: eventId } });

    res.status(204).send(); // No content
  } catch (error) {
    console.error("Failed to delete calendar event:", error);
    res.status(500).json({ success: false, error: "Could not delete event." });
  }
});

/**
 * POST /api/calendar-events/sync
 * Manually triggers Google Calendar sync for the logged-in user
 */
router.post("/api/calendar-events/sync", async (req: Request, res: Response) => {
  const userId = req.user!.id;

  try {
    const gcal = await getGoogleCalendarClient(userId);
    
    if (!gcal) {
      return res.status(400).json({ 
        success: false, 
        error: "No Google account linked. Please log in again to grant calendar access." 
      });
    }

    await syncGoogleCalendarEvents(userId, gcal);
    
    // Return updated events
    const events = await prisma.talentEvent.findMany({
      where: { userId: userId },
      orderBy: { startTime: "asc" },
    });

    res.json({ 
      success: true, 
      message: "Calendar sync completed successfully",
      data: { events } 
    });
  } catch (error) {
    console.error("Manual calendar sync failed:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to sync calendar. Please try again later." 
    });
  }
});

export default router;