import { Router } from "express";
import { listUserMessages, getUserMessage } from "../integrations/gmail/googleClient.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/gmail/messages", requireAuth, async (req, res, next) => {
  try {
    const messages = await listUserMessages(req.user!.id);
    res.json({ messages });
  } catch (error) {
    next(error);
  }
});

router.get("/gmail/messages/:id", requireAuth, async (req, res, next) => {
  try {
    const message = await getUserMessage(req.user!.id, req.params.id);
    res.json({ message });
  } catch (error) {
    next(error);
  }
});

export default router;
