import { Router } from "express";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";

const router = Router();

// All onboarding endpoints require auth
router.use(requireAuth);

/**
 * GET /api/onboarding/me
 * Returns the onboarding record for the logged-in user.
 */
router.get("/onboarding/me", async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        onboardingComplete: true,
        onboarding_status: true,
        onboarding_responses: true,
        onboardingSkippedAt: true
      }
    });

    res.json({ onboarding: user });
  } catch (err) {
    console.error("Error fetching onboarding", err);
    res.status(500).json({ error: "Failed to load onboarding state" });
  }
});

/**
 * POST /api/onboarding/submit
 * Saves the user's onboarding form and moves to REVIEW status.
 */
router.post("/onboarding/submit", async (req, res) => {
  try {
    const payload = req.body ?? {};
    const userId = req.user!.id;

    const user = await prisma.user.update({
      where: { id: userId },
      data: { 
        onboardingComplete: true,
        onboarding_responses: payload,
        onboarding_status: "review",
        onboardingSkippedAt: null, // Clear skip timestamp if completing
      },
    });

    res.status(201).json({ onboarding: user });
  } catch (err) {
    console.error("Error submitting onboarding", err);
    res.status(500).json({ error: "Failed to submit onboarding" });
  }
});

/**
 * POST /api/onboarding/skip
 * Allows user to skip onboarding and complete it later.
 */
router.post("/onboarding/skip", async (req, res) => {
  try {
    const userId = req.user!.id;

    await prisma.user.update({
      where: { id: userId },
      data: {
        onboardingSkippedAt: new Date(),
        onboardingComplete: false, // Ensure it's marked as incomplete
      },
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Error skipping onboarding", err);
    res.status(500).json({ error: "Failed to skip onboarding" });
  }
});

/**
 * POST /api/onboarding/complete
 * Marks onboarding as completed (can be called after completing onboarding form).
 */
router.post("/onboarding/complete", async (req, res) => {
  try {
    const userId = req.user!.id;

    await prisma.user.update({
      where: { id: userId },
      data: {
        onboardingComplete: true,
        onboardingSkippedAt: null, // Clear skip timestamp
      },
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Error completing onboarding", err);
    res.status(500).json({ error: "Failed to complete onboarding" });
  }
});

/**
 * PATCH /api/onboarding/:userId
 * Admin or Manager can approve/reject onboarding.
 */
router.patch(
  "/onboarding/:userId",
  requireRole(["ADMIN", "TALENT_MANAGER"]),
  async (req, res) => {
    try {
      const { status, notes } = req.body ?? {};

      if (!status) {
        return res.status(400).json({ error: "Missing status field" });
      }

      const user = await prisma.user.update({
        where: { id: req.params.userId },
        data: {
          onboarding_status: status,
          admin_notes: notes,
          updatedAt: new Date()
        },
      });

      res.json({ onboarding: user });
    } catch (err) {
      console.error("Error updating onboarding status", err);
      res.status(500).json({ error: "Failed to update onboarding" });
    }
  }
);

export default router;
