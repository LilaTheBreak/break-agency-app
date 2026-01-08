import { Storage, Bucket } from "@google-cloud/storage";
import { randomUUID } from "crypto";
import { safeEnv } from "../../utils/safeEnv.js";
import { logError } from "../../lib/logger.js";

/**
 * Google Cloud Storage Service
 * 
 * Handles all file operations for The Break app using GCS.
 * Files are private by default and accessed via signed URLs.
 */

// Environment variables
const GCS_PROJECT_ID = process.env.GCS_PROJECT_ID || "break-agency-storage";
const GCS_BUCKET_NAME = process.env.GCS_BUCKET_NAME || "break-agency-app-storage";
const GOOGLE_APPLICATION_CREDENTIALS_JSON = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

// Initialize GCS client
let storage: Storage | null = null;
let bucket: Bucket | null = null;

/**
 * Initialize GCS client with service account credentials
 */
function initializeGCS(): { storage: Storage; bucket: Bucket } {
  if (storage && bucket) {
    return { storage, bucket };
  }

  if (!GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    throw new Error(
      "GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable is required. " +
      "Please set it in Railway environment variables with your service account JSON."
    );
  }

  try {
    // Parse JSON credentials from environment variable
    const credentials = JSON.parse(GOOGLE_APPLICATION_CREDENTIALS_JSON);
    
    storage = new Storage({
      projectId: GCS_PROJECT_ID,
      credentials
    });

    bucket = storage.bucket(GCS_BUCKET_NAME);

    // Verify bucket exists (async, non-blocking)
    bucket.exists().then(([exists]) => {
      if (!exists) {
        console.warn(`[GCS] Bucket ${GCS_BUCKET_NAME} does not exist. Attempting to create...`);
        return bucket!.create({
          location: "europe-west2", // London
          storageClass: "STANDARD"
        }).then(() => {
          console.log(`[GCS] Bucket ${GCS_BUCKET_NAME} created successfully`);
        }).catch((createError) => {
          console.error(`[GCS] Failed to create bucket:`, createError);
          console.error(`[GCS] Please create bucket ${GCS_BUCKET_NAME} manually in GCP console`);
        });
      }
      console.log(`[GCS] Bucket ${GCS_BUCKET_NAME} verified`);
    }).catch((error) => {
      console.error(`[GCS] Error checking bucket:`, error);
      // Don't throw - allow app to start, but uploads will fail
    });

    console.log(`[GCS] Initialized for project: ${GCS_PROJECT_ID}, bucket: ${GCS_BUCKET_NAME}`);
    
    return { storage, bucket };
  } catch (error) {
    logError("Failed to initialize Google Cloud Storage", error);
    throw new Error(
      `GCS initialization failed: ${error instanceof Error ? error.message : String(error)}. ` +
      "Please check GOOGLE_APPLICATION_CREDENTIALS_JSON is valid JSON."
    );
  }
}

/**
 * Build object key (path) for a file
 * Format: folder/userId/year/month/uuid-filename
 */
export function buildObjectKey(userId: string, filename: string, folder?: string): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const safeName = filename.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const uuid = randomUUID();
  
  const basePath = folder ? `${folder}/${userId}` : `uploads/${userId}`;
  return `${basePath}/${year}/${month}/${uuid}-${safeName}`;
}

/**
 * Upload a file to GCS
 * 
 * @param buffer - File buffer
 * @param filename - Original filename
 * @param mimeType - MIME type
 * @param folder - Optional folder (e.g., "contracts", "avatars", "briefs")
 * @param userId - User ID for organizing files
 * @returns Object with storage path, signed URL, and metadata
 */
export async function uploadFile(
  buffer: Buffer,
  filename: string,
  mimeType: string,
  folder?: string,
  userId?: string
): Promise<{
  key: string;
  url: string;
  signedUrl: string;
  mimeType: string;
}> {
  try {
    const { bucket: gcsBucket } = initializeGCS();
    
    // Build object key
    const key = userId 
      ? buildObjectKey(userId, filename, folder)
      : buildObjectKey("anon", filename, folder);
    
    // Upload file
    const file = gcsBucket.file(key);
    await file.save(buffer, {
      metadata: {
        contentType: mimeType,
        metadata: {
          originalFilename: filename,
          uploadedAt: new Date().toISOString()
        }
      }
    });

    // Generate signed URL (expires in 1 hour by default)
    const [signedUrl] = await file.getSignedUrl({
      action: "read",
      expires: Date.now() + 60 * 60 * 1000 // 1 hour
    });

    console.log(`[GCS] Uploaded file: ${key} (${buffer.length} bytes)`);

    return {
      key,
      url: signedUrl, // Use signed URL as primary URL
      signedUrl,
      mimeType
    };
  } catch (error) {
    logError("GCS upload failed", error, { filename, folder, userId });
    throw error;
  }
}

/**
 * Get a signed URL for a file
 * 
 * @param key - Object key (path) in GCS
 * @param expiresIn - Expiration time in seconds (default: 15 minutes, max: 7 days)
 * @returns Signed URL
 */
export async function getSignedUrl(key: string, expiresIn: number = 900): Promise<string> {
  try {
    const { bucket: gcsBucket } = initializeGCS();
    
    // Clamp expiration between 1 minute and 7 days (GCS limit)
    const clampedExpiresIn = Math.max(60, Math.min(expiresIn, 7 * 24 * 60 * 60));
    
    const file = gcsBucket.file(key);
    const [signedUrl] = await file.getSignedUrl({
      action: "read",
      expires: Date.now() + clampedExpiresIn * 1000
    });

    return signedUrl;
  } catch (error) {
    logError("GCS signed URL generation failed", error, { key });
    throw error;
  }
}

/**
 * Delete a file from GCS
 * 
 * @param key - Object key (path) in GCS
 */
export async function deleteFile(key: string): Promise<void> {
  try {
    const { bucket: gcsBucket } = initializeGCS();
    const file = gcsBucket.file(key);
    
    const [exists] = await file.exists();
    if (!exists) {
      console.warn(`[GCS] File does not exist: ${key}`);
      return;
    }

    await file.delete();
    console.log(`[GCS] Deleted file: ${key}`);
  } catch (error) {
    logError("GCS delete failed", error, { key });
    throw error;
  }
}

/**
 * Check if a file exists in GCS
 * 
 * @param key - Object key (path) in GCS
 * @returns True if file exists
 */
export async function fileExists(key: string): Promise<boolean> {
  try {
    const { bucket: gcsBucket } = initializeGCS();
    const file = gcsBucket.file(key);
    const [exists] = await file.exists();
    return exists;
  } catch (error) {
    logError("GCS file existence check failed", error, { key });
    return false;
  }
}

/**
 * Get file metadata
 * 
 * @param key - Object key (path) in GCS
 * @returns File metadata or null if not found
 */
export async function getFileMetadata(key: string): Promise<{
  size: number;
  contentType: string;
  updated: Date;
} | null> {
  try {
    const { bucket: gcsBucket } = initializeGCS();
    const file = gcsBucket.file(key);
    const [metadata] = await file.getMetadata();
    
    return {
      size: parseInt(String(metadata.size || "0"), 10),
      contentType: metadata.contentType || "application/octet-stream",
      updated: new Date(metadata.updated || Date.now())
    };
  } catch (error) {
    logError("GCS metadata fetch failed", error, { key });
    return null;
  }
}

/**
 * Validate GCS configuration at startup
 */
export function validateGCSConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    errors.push("GOOGLE_APPLICATION_CREDENTIALS_JSON is not set");
  } else {
    try {
      JSON.parse(GOOGLE_APPLICATION_CREDENTIALS_JSON);
    } catch {
      errors.push("GOOGLE_APPLICATION_CREDENTIALS_JSON is not valid JSON");
    }
  }

  if (!GCS_BUCKET_NAME) {
    errors.push("GCS_BUCKET_NAME is not set");
  }

  if (!GCS_PROJECT_ID) {
    errors.push("GCS_PROJECT_ID is not set");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

