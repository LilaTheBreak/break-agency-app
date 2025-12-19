import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
const prisma = new PrismaClient();

// Middleware to check if user is admin
const requireAdmin = (req: Request, res: Response, next: any) => {
  const user = (req as any).user;
  if (!user || (user.role !== "ADMIN" && user.role !== "SUPERADMIN")) {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

// Get all pending users
router.get("/pending", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const pendingUsers = await prisma.user.findMany({
      where: {
        onboarding_status: "pending_review"
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        onboarding_status: true,
        bio: true,
        location: true
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    res.json(pendingUsers);
  } catch (error) {
    console.error("Error fetching pending users:", error);
    res.status(500).json({ error: "Failed to fetch pending users" });
  }
});

// Approve a user
router.post("/:userId/approve", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        onboarding_status: "approved",
        onboardingComplete: true,
        updatedAt: new Date()
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        onboarding_status: true
      }
    });

    res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Error approving user:", error);
    res.status(500).json({ error: "Failed to approve user" });
  }
});

// Reject a user
router.post("/:userId/reject", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        onboarding_status: "rejected",
        admin_notes: reason || "Application rejected",
        updatedAt: new Date()
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        onboarding_status: true
      }
    });

    res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Error rejecting user:", error);
    res.status(500).json({ error: "Failed to reject user" });
  }
});

export default router;
