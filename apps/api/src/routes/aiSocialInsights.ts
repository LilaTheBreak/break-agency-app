import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { generateSocialInsights, InvalidSocialAiResponseError } from "../services/aiSocialInsightsService.js";
import { isAdmin as checkIsAdmin } from "../lib/roleHelpers.js";

const router = Router();

const paramsSchema = z.object({ userId: z.string().min(1) });

router.post("/ai/social-insights/:userId", requireAuth, async (req: Request, res: Response) => {
  const parsedParams = paramsSchema.safeParse(req.params);
  if (!parsedParams.success) {
    return res.status(400).json({ success: false, message: "userId is required" });
  }
  const targetUserId = parsedParams.data.userId;
  const currentUser = req.user!;
  const userIsAdmin = checkIsAdmin(currentUser);
  if (currentUser.id !== targetUserId && !userIsAdmin) {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }

  try {
    const result = await generateSocialInsights(targetUserId);
    return res.json(result);
  } catch (error) {
    if (error instanceof InvalidSocialAiResponseError) {
      return res.status(400).json({ success: false, message: "AI returned invalid JSON" });
    }
    console.error("ai social insights error", error);
    return res.status(500).json({ success: false, message: "Unable to generate social insights" });
  }
});

export default router;
