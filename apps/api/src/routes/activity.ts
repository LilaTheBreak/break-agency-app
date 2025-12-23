import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import prisma from "../lib/prisma.js";

const router = Router();

router.get("/api/activity", requireAuth, async (req: Request, res: Response) => {
  // Check single role field (not roles array)
  const userRole = req.user?.role || "";
  if (userRole !== "ADMIN" && userRole !== "SUPERADMIN") {
    return res.status(200).json([]); // Return empty array instead of 403
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
    console.error("Activity feed error:", error);
    // Return empty array on error - don't crash dashboard
    res.status(200).json([]);
  }
});

export default router;