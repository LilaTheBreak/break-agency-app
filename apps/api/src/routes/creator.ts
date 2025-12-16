import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import prisma from "../lib/prisma.js";
import { z } from "zod";
const router = Router();

// Middleware to ensure only admins can access these routes
const requireAdmin = (req: Request, res: Response, next: Function) => {
  const userRoles = req.user?.roles?.map(r => r.role.name) || [];
  if (!userRoles.includes("ADMIN") && !userRoles.includes("SUPER_ADMIN")) {
    return res.status(403).json({ error: "Forbidden: Access is restricted to administrators." });
  }
  next();
};

router.use("/api/creator", requireAuth);

/**
 * GET /api/creator/:id/score
 * Fetches the latest score for a specific creator.
 */
router.get("/api/creator/:id/score", async (req: Request, res: Response) => {
  try {
    const score = await prisma.creatorScore.findFirst({
      where: { userId: req.params.id },
      orderBy: { createdAt: "desc" },
    });

    if (!score) {
      return res.status(404).json({ error: "No score found for this creator." });
    }

    res.json({ score });
  } catch (error) {
    console.error("Failed to fetch creator score:", error);
    res.status(500).json({ error: "Could not load creator score." });
  }
});

export default router;
