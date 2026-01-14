import { Router, type Request, type Response } from "express";
import prisma from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

/**
 * TRACKING FEED (Open + Click Events)
 * Lists last 50 tracking events (opens and clicks) for inbound emails belonging to the user.
 */
router.get("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    // Fetch both open and click events
    const [openEvents, clickEvents] = await Promise.all([
      prisma.trackingPixelEvent.findMany({
        where: {
          InboundEmail: {
            userId,
          },
        },
        include: {
          InboundEmail: {
            select: {
              id: true,
              subject: true,
              fromEmail: true,
              toEmail: true,
              receivedAt: true,
              categories: true,
            },
          },
        },
        orderBy: {
          openedAt: "desc",
        },
        take: 50,
      }),
      prisma.emailClickEvent.findMany({
        where: {
          InboundEmail: {
            userId,
          },
        },
        include: {
          InboundEmail: {
            select: {
              id: true,
              subject: true,
              fromEmail: true,
              toEmail: true,
              receivedAt: true,
              categories: true,
            },
          },
        },
        orderBy: {
          clickedAt: "desc",
        },
        take: 50,
      }),
    ]);

    // Combine and format events
    const openData = openEvents.map((e) => ({
      id: e.id,
      type: "open",
      emailId: e.emailId,
      timestamp: e.openedAt,
      ip: e.ip,
      userAgent: e.userAgent,
      metadata: e.metadata,
      email: e.InboundEmail,
    }));

    const clickData = clickEvents.map((e) => ({
      id: e.id,
      type: "click",
      emailId: e.emailId,
      timestamp: e.clickedAt,
      linkUrl: e.linkUrl,
      ip: e.ip,
      userAgent: e.userAgent,
      metadata: e.metadata,
      email: e.InboundEmail,
    }));

    // Combine and sort by timestamp
    const allEvents = [...openData, ...clickData].sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    ).slice(0, 50);

    return res.json({
      ok: true,
      count: allEvents.length,
      opens: openEvents.length,
      clicks: clickEvents.length,
      data: allEvents,
    });
  } catch (error) {
    console.error("INBOX TRACKING ERROR:", error);
    return res.status(500).json({ ok: false, error: "Failed to load tracking events" });
  }
});

export default router;
