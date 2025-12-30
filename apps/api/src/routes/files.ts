import { Router, type Request, type Response, type NextFunction } from "express";
import prisma from "../lib/prisma.js";
import { deleteObject, buildObjectKey, s3 } from "../lib/s3.js";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import {
  requestUploadUrl,
  confirmUpload,
  listUserFiles,
  getDownloadUrl
} from "../services/fileService.js";
import { isAdmin as checkIsAdmin } from "../lib/roleHelpers.js";
import { safeEnv } from "../utils/safeEnv.js";
import { requireAuth } from "../middleware/auth.js";
import { logAuditEvent, logDestructiveAction } from "../lib/auditLogger.js";
import { logError } from "../lib/logger.js";
// import slackClient from "../integrations/slack/slackClient.js";

const router = Router();
const bucket = safeEnv("S3_BUCKET", "local-bucket");
const region = safeEnv("S3_REGION", "us-east-1");

router.get("/", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUser = req.user!;
    const folder = typeof req.query.folder === "string" ? req.query.folder : undefined;
    const targetUser = typeof req.query.userId === "string" ? req.query.userId : currentUser.id;
    const userIsAdmin = checkIsAdmin(currentUser);
    if (targetUser !== currentUser.id && !userIsAdmin) {
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
    const { filename, contentType } = req.body ?? {};
    if (!filename || !contentType) {
      return res.status(400).json({ error: true, message: "filename and contentType are required" });
    }
    const result = await requestUploadUrl(currentUser.id, filename, contentType);
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
    
    // Generate storage key
    const key = buildObjectKey(currentUser.id, filename);
    
    // Determine content type from base64 header or default
    let contentType = "application/octet-stream";
    const dataUrlMatch = content.match(/^data:([^;]+);base64,/);
    if (dataUrlMatch) {
      contentType = dataUrlMatch[1];
    }
    
    try {
      // Actually upload to S3
      await s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: buffer,
          ContentType: contentType,
        })
      );
      
      // Generate public or signed URL
      // Support both standard S3 and R2 endpoints
      const endpoint = process.env.S3_ENDPOINT;
      const forcePathStyle = process.env.S3_FORCE_PATH_STYLE === "true";
      let url: string;
      if (endpoint && forcePathStyle) {
        // Cloudflare R2 or S3-compatible with path-style
        url = `${endpoint}/${bucket}/${key}`;
      } else if (endpoint) {
        // Custom endpoint (virtual-hosted style)
        url = `${endpoint}/${key}`;
      } else {
        // Standard S3
        url = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
      }
      
      // Save file record to database
      const file = await prisma.file.create({
        data: {
          id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          updatedAt: new Date(),
          userId: currentUser.id,
          key,
          url,
          filename,
          type: contentType,
          folder: folder || null,
          size
        }
      });
      
      res.json({ file });
    } catch (s3Error) {
      console.error("[FILE_UPLOAD] S3 Error:", s3Error);
      
      // Return error - don't create stub records in production
      return res.status(500).json({ 
        error: true, 
        message: "File upload to storage failed. Please check storage configuration.",
        details: s3Error instanceof Error ? s3Error.message : String(s3Error)
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
  await deleteObject(file.key).catch(() => null);
  await prisma.file.delete({ where: { id: file.id } });
  res.json({ success: true });
});

// Phase 4: Removed requireUser - using requireAuth directly for consistency
  if (!req.user?.id) {
    return res.status(401).json({ error: true, message: "Authentication required" });
  }
  next();
}

export default router;
