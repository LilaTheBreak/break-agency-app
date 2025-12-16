import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import prisma from "../lib/prisma.js";
import { z } from "zod";
import { getGoogleCalendarClient, syncGoogleCalendarEvents } from "../lib/google.js";

const router = Router();

router.use("/api/calendar-events", requireAuth);

/**
 * GET /api/calendar-events
 * Fetches all calendar events for the logged-in user.
 * Also triggers a Google Calendar sync if an account is linked.
 */
router.get("/api/calendar-events", async (req: Request, res: Response) => {
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
    const talentProfile = await prisma.talent.findUnique({ where: { userId } });
    if (!talentProfile) {
      return res.json({ success: true, data: { events: [] } });
    }

    const events = await prisma.talentEvent.findMany({
      where: {
        talentId: talentProfile.id,
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
 * POST /api/calendar-events
 * Creates a new calendar event.
 */
router.post("/api/calendar-events", async (req: Request, res: Response) => {
  const parsed = EventCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: "Invalid payload.", details: parsed.error.flatten() });
  }

  try {
    const talent = await prisma.talent.findUnique({ where: { userId: req.user!.id } });
    if (!talent) {
      return res.status(404).json({ success: false, error: "Talent profile not found for this user." });
    }

    const newEvent = await prisma.talentEvent.create({
      data: {
        ...parsed.data,
        talentId: talent.id,
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
 * DELETE /api/calendar-events/:id
 * Deletes a calendar event.
 */
router.delete("/api/calendar-events/:id", async (req: Request, res: Response) => {
  try {
    const eventId = req.params.id;
    const talent = await prisma.talent.findUnique({ where: { userId: req.user!.id } });

    // Ensure the user can only delete their own events
    const eventToDelete = await prisma.talentEvent.findFirst({
      where: { id: eventId, talentId: talent?.id },
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

export default router;