import { Router } from "express";
import { requireAuth } from '../middleware/auth';
import { extractDocumentText } from '../services/documentExtraction';
import { isAdmin as checkIsAdmin } from '../lib/roleHelpers';

const router = Router();

router.get("/documents/:id/text", requireAuth, async (req, res, next) => {
  try {
    const fileId = req.params.id;
    if (!fileId) {
      return res.status(400).json({ success: false, message: "File id is required" });
    }
    const isAdmin = checkIsAdmin(req.user!);
    const result = await extractDocumentText({ fileId, userId: req.user!.id, isAdmin });
    res.json({ success: true, text: result.text });
  } catch (error) {
    next(error);
  }
});

export default router;
