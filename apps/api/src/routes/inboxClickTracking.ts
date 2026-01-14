import { Router, type Request, type Response } from "express";
import prisma from '../lib/prisma.js';
import { generateId } from '../lib/utils.js';

const router = Router();

/**
 * CLICK TRACKING ENDPOINT
 * GET /api/inbox/click/:emailId
 * 
 * Tracks when a link in an email is clicked.
 * This endpoint should be called when a tracked link is clicked.
 * 
 * Query params:
 * - url: The URL that was clicked (required)
 * - emailId: The email ID (from route param)
 */
router.get("/:emailId", async (req: Request, res: Response) => {
  try {
    const { emailId } = req.params;
    const { url } = req.query;

    if (!url || typeof url !== "string") {
      return res.status(400).json({ ok: false, error: "URL parameter required" });
    }

    // Verify email exists
    const email = await prisma.inboundEmail.findUnique({
      where: { id: emailId },
      select: { id: true },
    });

    if (!email) {
      return res.status(404).json({ ok: false, error: "Email not found" });
    }

    // Record click event
    const clickEvent = await prisma.emailClickEvent.create({
      data: {
        id: generateId("click"),
        emailId,
        linkUrl: url,
        ip: req.ip || req.headers["x-forwarded-for"] as string || null,
        userAgent: req.headers["user-agent"] || null,
        clickedAt: new Date(),
        metadata: {
          referer: req.headers.referer || null,
          timestamp: new Date().toISOString(),
        },
      },
    });

    // Redirect to the actual URL
    res.redirect(url);
  } catch (error) {
    console.error("CLICK TRACKING ERROR:", error);
    // Still redirect even if tracking fails
    const url = req.query.url as string;
    if (url) {
      res.redirect(url);
    } else {
      res.status(500).json({ ok: false, error: "Failed to track click" });
    }
  }
});

/**
 * GET /api/inbox/click-tracking/:emailId
 * Get all click events for an email
 */
router.get("/tracking/:emailId", async (req: Request, res: Response) => {
  try {
    const { emailId } = req.params;

    const events = await prisma.emailClickEvent.findMany({
      where: { emailId },
      orderBy: { clickedAt: "desc" },
    });

    res.json({
      ok: true,
      count: events.length,
      data: events,
    });
  } catch (error) {
    console.error("CLICK TRACKING FETCH ERROR:", error);
    res.status(500).json({ ok: false, error: "Failed to fetch click events" });
  }
});

export default router;

