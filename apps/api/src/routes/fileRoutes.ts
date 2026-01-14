import { Router } from "express";
import {
  handleRequestUploadUrl,
  handleConfirmUpload,
  handleListFiles,
  handleDownloadUrl
} from '../controllers/fileController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post("/upload-url", requireAuth, handleRequestUploadUrl);
router.post("/confirm", requireAuth, handleConfirmUpload);
router.get("/", requireAuth, handleListFiles);
router.get("/:id/download", requireAuth, handleDownloadUrl);

export default router;
