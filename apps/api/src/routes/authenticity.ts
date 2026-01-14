import { Router } from "express";
import { analyseAuthenticity } from '../services/authenticityService.js';
import { requireAuth } from '../middleware/auth.js';

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
