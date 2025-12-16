import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import prisma from "../lib/prisma.js";

const router = Router();

router.get("/api/activity", requireAuth, async (req: Request, res: Response) => {
  const userRoles = req.user?.roles?.map(r => r.role.name) || [];
  if (!userRoles.includes("ADMIN") && !userRoles.includes("SUPER_ADMIN")) {
    return res.status(403).json({ error: "Forbidden: Access is restricted to administrators." });
  }

  try {
    const limit = parseInt(req.query.limit as string) || 5;

    const activity = await prisma.adminActivity.findMany({
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: { select: { name: true, avatarUrl: true } },
      },
    });
    res.json(activity);
  } catch (error) {
    res.status(500).json({ error: "Could not load activity feed." });
  }
});

export default router;