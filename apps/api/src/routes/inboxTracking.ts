import { Router, type Request, type Response } from "express";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

/**
 * OPEN TRACKING FEED
 * Lists last 50 tracking pixel events for inbound emails belonging to the user.
 */
router.get("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const events = await prisma.trackingPixelEvent.findMany({
      where: {
        inboundEmail: {
          userId, // Only pull events for emails owned by this user
        },
      },
      include: {
        inboundEmail: {
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
      // TrackingPixelEvent has **NO createdAt**, so we sort by openedAt
      orderBy: {
        openedAt: "desc",
      },
      take: 50,
    });

    const data = events.map((e) => ({
      id: e.id,
      emailId: e.emailId,
      openedAt: e.openedAt,
      ip: e.ip,
      userAgent: e.userAgent,
      metadata: e.metadata,
      email: e.inboundEmail,
    }));

    res.json({
      ok: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error("INBOX TRACKING ERROR:", error);
    res.status(500).json({ ok: false, error: "Failed to load tracking events" });
  }
});

export default router;
