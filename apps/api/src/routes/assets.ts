import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { z } from "zod";
import crypto from "crypto";

const router = Router();

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "auto",
  endpoint: process.env.AWS_ENDPOINT, // For S3-compatible services like Cloudflare R2
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const UploadUrlSchema = z.object({
  fileName: z.string().min(1, "fileName is required"),
  contentType: z.string().min(1, "contentType is required"),
  folder: z.string().optional(),
});

/**
 * POST /api/assets/upload-url
 * Generates a pre-signed URL for uploading a file to S3.
 */
router.post("/api/assets/upload-url", requireAuth, async (req: Request, res: Response) => {
  const parsed = UploadUrlSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload.", details: parsed.error.flatten() });
  }

  const { fileName, contentType, folder } = parsed.data;
  const bucketName = process.env.AWS_BUCKET_NAME;

  if (!bucketName) {
    console.error("AWS_BUCKET_NAME is not set.");
    return res.status(500).json({ error: "File upload is not configured." });
  }

  // Create a unique key for the file to prevent overwrites
  const randomBytes = crypto.randomBytes(16).toString("hex");
  const key = folder ? `${folder}/${randomBytes}-${fileName}` : `${randomBytes}-${fileName}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: contentType,
  });

  try {
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // URL expires in 1 hour

    res.json({ uploadUrl, key });
  } catch (error) {
    console.error("Failed to generate pre-signed URL:", error);
    res.status(500).json({ error: "Could not create upload URL." });
  }
});

export default router;