import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";

/**
 * Storage Service
 * Handles file uploads, downloads, and deletions using AWS S3
 */

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "eu-west-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || "break-agency-files";
const SIGNED_URL_EXPIRY = 3600; // 1 hour in seconds

/**
 * Generate a storage path following the pattern: /talent/{talentId}/{category}/{filename}
 */
export function generateStoragePath(talentId: string, category: string, fileName: string): string {
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  const timestamp = Date.now();
  const uniqueSuffix = crypto.randomBytes(4).toString("hex");
  const finalFileName = `${timestamp}_${uniqueSuffix}_${sanitizedName}`;
  return `talent/${talentId}/${category}/${finalFileName}`;
}

/**
 * Upload a file to S3
 */
export async function uploadFileToS3(
  key: string,
  fileBuffer: Buffer,
  mimeType: string
): Promise<{ url: string; path: string }> {
  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: mimeType,
      ServerSideEncryption: "AES256",
      // Add metadata
      Metadata: {
        uploadedAt: new Date().toISOString(),
      },
    });

    await s3Client.send(command);
    console.log(`[STORAGE] File uploaded successfully: ${key}`);

    // Generate signed URL for immediate access
    const url = await generateSignedUrl(key);

    return { url, path: key };
  } catch (error) {
    console.error("[STORAGE] Error uploading file:", error);
    throw new Error(`Failed to upload file to storage: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Generate a signed URL for accessing a file
 */
export async function generateSignedUrl(key: string, expirySeconds = SIGNED_URL_EXPIRY): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: expirySeconds });
    return signedUrl;
  } catch (error) {
    console.error("[STORAGE] Error generating signed URL:", error);
    throw new Error(`Failed to generate download URL: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Delete a file from S3
 */
export async function deleteFileFromS3(key: string): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
    console.log(`[STORAGE] File deleted successfully: ${key}`);
  } catch (error) {
    console.error("[STORAGE] Error deleting file:", error);
    throw new Error(`Failed to delete file from storage: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Validate file before upload
 */
export function validateFile(
  fileName: string,
  fileSize: number,
  mimeType: string
): { valid: boolean; error?: string } {
  const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
  const ALLOWED_TYPES = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "video/mp4",
    "video/quicktime",
    "audio/mpeg",
    "audio/wav",
  ];

  if (!fileName || fileName.trim().length === 0) {
    return { valid: false, error: "File name is required" };
  }

  if (fileSize > MAX_FILE_SIZE) {
    return { valid: false, error: `File size exceeds maximum of 500MB (got ${Math.round(fileSize / 1024 / 1024)}MB)` };
  }

  if (!ALLOWED_TYPES.includes(mimeType)) {
    return {
      valid: false,
      error: `File type not allowed. Supported types: Images (JPG, PNG, GIF), PDFs, Documents (DOC, DOCX), Spreadsheets, Videos (MP4), Audio (MP3, WAV)`,
    };
  }

  return { valid: true };
}

/**
 * Determine file type from MIME type
 */
export function getFileTypeFromMimeType(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType === "application/pdf") return "pdf";
  if (
    mimeType.includes("word") ||
    mimeType.includes("document") ||
    mimeType === "application/msword"
  )
    return "doc";
  return "other";
}
