import { Router } from "express";
import { analyseAuthenticity } from '../services/authenticityService';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.post("/check", requireAuth, async (req, res, next) => {
  try {
    const { senderEmail, messageText, links } = req.body ?? {};
    const result = await analyseAuthenticity({
      senderEmail,
      messageText: messageText || "",
      links: Array.isArray(links) ? links : []
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
