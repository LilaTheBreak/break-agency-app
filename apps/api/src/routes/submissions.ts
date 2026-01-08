import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
const prisma = new PrismaClient();

// GET /api/submissions - Get all submissions for the current user
router.get("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const submissions = await prisma.submission.findMany({
      where: { creatorId: userId },
      include: {
        Opportunity: {
          select: {
            id: true,
            title: true,
            brand: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json({ submissions });
  } catch (error) {
    console.error("[SUBMISSIONS] Error fetching submissions:", error);
    return res.status(500).json({ error: "Failed to fetch submissions" });
  }
});

// GET /api/submissions/:id - Get a specific submission
router.get("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const submission = await prisma.submission.findFirst({
      where: {
        id,
        creatorId: userId,
      },
      include: {
        Opportunity: true,
        User: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!submission) {
      return res.status(404).json({ error: "Submission not found" });
    }

    return res.json({ submission });
  } catch (error) {
    console.error("[SUBMISSIONS] Error fetching submission:", error);
    return res.status(500).json({ error: "Failed to fetch submission" });
  }
});

// POST /api/submissions - Create a new submission
router.post("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { opportunityId, platform, title, files, contentUrl } = req.body;

    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    if (!platform) {
      return res.status(400).json({ error: "Platform is required" });
    }

    // Verify the opportunity exists if provided
    if (opportunityId) {
      const opportunity = await prisma.opportunity.findUnique({
        where: { id: opportunityId },
      });

      if (!opportunity) {
        return res.status(404).json({ error: "Opportunity not found" });
      }
    }

    const submission = await prisma.submission.create({
      data: {
        id: `submission_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        creatorId: userId,
        opportunityId: opportunityId || null,
        title,
        platform: platform.toLowerCase(),
        status: "draft",
        files: files || [],
        revisions: [],
        contentUrl: contentUrl || null,
        updatedAt: new Date(),
      },
      include: {
        Opportunity: true,
      },
    });

    return res.status(201).json({ submission });
  } catch (error) {
    console.error("[SUBMISSIONS] Error creating submission:", error);
    return res.status(500).json({ error: "Failed to create submission" });
  }
});

// PATCH /api/submissions/:id - Update a submission
router.patch("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Verify ownership
    const existing = await prisma.submission.findFirst({
      where: { id, creatorId: userId },
    });

    if (!existing) {
      return res.status(404).json({ error: "Submission not found" });
    }

    const { status, files, revisions, contentUrl, feedback, title, platform } = req.body;

    const submission = await prisma.submission.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(platform && { platform: platform.toLowerCase() }),
        ...(status && { status }),
        ...(files && { files }),
        ...(revisions && { revisions }),
        ...(contentUrl !== undefined && { contentUrl }),
        ...(feedback !== undefined && { feedback }),
      },
      include: {
        Opportunity: true,
      },
    });

    return res.json({ submission });
  } catch (error) {
    console.error("[SUBMISSIONS] Error updating submission:", error);
    return res.status(500).json({ error: "Failed to update submission" });
  }
});

// DELETE /api/submissions/:id - Delete a submission
router.delete("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Verify ownership
    const existing = await prisma.submission.findFirst({
      where: { id, creatorId: userId },
    });

    if (!existing) {
      return res.status(404).json({ error: "Submission not found" });
    }

    await prisma.submission.delete({
      where: { id },
    });

    return res.json({ message: "Submission deleted successfully" });
  } catch (error) {
    console.error("[SUBMISSIONS] Error deleting submission:", error);
    return res.status(500).json({ error: "Failed to delete submission" });
  }
});

export default router;
