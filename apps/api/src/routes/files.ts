import { Router, type Request, type Response, type NextFunction } from "express";
import prisma from '../lib/prisma';
import {
  uploadFile as uploadFileToGCS,
  getSignedUrl as getGCSignedUrl,
  deleteFile as deleteFileFromGCS,
  buildObjectKey
} from '../services/storage/googleCloudStorage';
import {
  requestUploadUrl,
  confirmUpload,
  listUserFiles,
  getDownloadUrl
} from '../services/fileService';
import { isAdmin as checkIsAdmin } from '../lib/roleHelpers';
import { requireAuth } from '../middleware/auth';
import { logAuditEvent, logDestructiveAction } from '../lib/auditLogger';
import { logError } from '../lib/logger';
import { getEffectiveUserId, enforceDataScoping } from '../lib/dataScopingHelpers';
// import slackClient from '../integrations/slack/slackClient';

const router = Router();

router.get("/", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUser = req.user!;
    // SECURITY FIX: Use effective user ID to prevent accessing other users' files while impersonating
    const effectiveUserId = getEffectiveUserId(req as any);
    const folder = typeof req.query.folder === "string" ? req.query.folder : undefined;
    const targetUser = typeof req.query.userId === "string" ? req.query.userId : effectiveUserId;
    const userIsAdmin = checkIsAdmin(currentUser);
    // SECURITY FIX: Enforce data scoping - cannot access other users' files while impersonating
    if (targetUser !== effectiveUserId && !userIsAdmin) {
      return res.status(403).json({ error: true, message: "Forbidden" });
    }
    const files = await listUserFiles(targetUser, folder);
    res.json({ files });
  } catch (err) {
    next(err);
  }
});

router.post("/upload-url", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUser = req.user!;
    // SECURITY FIX: Use effective user ID for upload authorization
    const effectiveUserId = getEffectiveUserId(req as any);
    const { filename, contentType } = req.body ?? {};
    if (!filename || !contentType) {
      return res.status(400).json({ error: true, message: "filename and contentType are required" });
    }
    const result = await requestUploadUrl(effectiveUserId, filename, contentType);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post("/upload", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUser = req.user!;
    const { filename, content, folder } = req.body ?? {};
    
    if (!filename || !content) {
      return res.status(400).json({ error: true, message: "filename and content are required" });
    }

    // Parse base64 content
    const base64Data = content.replace(/^data:[^;]+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    const size = buffer.length;
    
    // Determine content type from base64 header or default
    let contentType = "application/octet-stream";
    const dataUrlMatch = content.match(/^data:([^;]+);base64,/);
    if (dataUrlMatch) {
      contentType = dataUrlMatch[1];
    }
    
    try {
      // Upload to Google Cloud Storage
      const uploadResult = await uploadFileToGCS(
        buffer,
        filename,
        contentType,
        folder,
        currentUser.id
      );
      
      // Save file record to database
      const file = await prisma.file.create({
        data: {
          id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          updatedAt: new Date(),
          userId: currentUser.id,
          key: uploadResult.key,
          url: uploadResult.signedUrl, // Store signed URL (will expire, but we can regenerate)
          filename,
          type: contentType,
          folder: folder || null,
          size
        }
      });
      
      res.json({ file });
    } catch (uploadError) {
      console.error("[FILE_UPLOAD] GCS Error:", uploadError);
      
      // Return error - don't create stub records in production
      return res.status(500).json({ 
        error: true, 
        message: "File upload to storage failed. Please check storage configuration.",
        details: uploadError instanceof Error ? uploadError.message : String(uploadError)
      });
    }
  } catch (err) {
    console.error("[FILE_UPLOAD] Error:", err);
    next(err);
  }
});

router.post("/confirm", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUser = req.user!;
    const { fileKey, filename, type } = req.body ?? {};
    if (!fileKey || !filename || !type) {
      return res.status(400).json({ error: true, message: "fileKey, filename, type are required" });
    }
    const file = await confirmUpload(currentUser.id, fileKey, filename, type);
    res.json({ file });
  } catch (err) {
    next(err);
  }
});

router.get("/:id/download", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUser = req.user!;
    const userIsAdmin = checkIsAdmin(currentUser);
    const file = await getDownloadUrl(req.params.id, currentUser.id, userIsAdmin);
    res.json({ url: file.url });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  const currentUser = req.user!;
  const file = await prisma.file.findUnique({ where: { id: req.params.id } });
  if (!file) {
    return res.status(404).json({ error: true, message: "File not found" });
  }
  const userIsAdmin = checkIsAdmin(currentUser);
  if (file.userId !== currentUser.id && !userIsAdmin) {
    return res.status(403).json({ error: true, message: "Forbidden" });
  }
  await deleteFileFromGCS(file.key).catch(() => null);
  await prisma.file.delete({ where: { id: file.id } });
  res.json({ success: true });
});

export default router;
