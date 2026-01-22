import { Storage, Bucket } from "@google-cloud/storage";
import { randomUUID } from "crypto";
import { safeEnv } from '../../utils/safeEnv.js';
import { logError } from '../../lib/logger.js';

/**
 * Google Cloud Storage Service with Workload Identity Federation
 * 
 * Handles all file operations for The Break app using GCS.
 * Authenticates via OIDC (Workload Identity Federation) - no service account keys required.
 * Files are private by default and accessed via signed URLs.
 * 
 * Authentication Flow:
 * 1. Application Default Credentials (ADC) automatically detects OIDC environment
 * 2. Railway provides OIDC token via OIDC_TOKEN environment variable
 * 3. Token is exchanged with Google's STS for temporary access credentials
 * 4. No JSON service account keys are stored or transmitted
 */

// Environment variables for Workload Identity Federation
const GCS_PROJECT_ID = process.env.GCS_PROJECT_ID || "break-agency-storage";
const GCS_BUCKET_NAME = process.env.GCS_BUCKET_NAME || "break-agency-app-storage";
const GOOGLE_CLOUD_PROJECT = process.env.GOOGLE_CLOUD_PROJECT;
const GOOGLE_WORKLOAD_IDENTITY_PROVIDER = process.env.GOOGLE_WORKLOAD_IDENTITY_PROVIDER;
const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;

// Initialize GCS client
let storage: Storage | null = null;
let bucket: Bucket | null = null;
let authMethod: string = "unknown";

/**
 * Initialize GCS client with Workload Identity Federation (OIDC)
 * 
 * Uses Application Default Credentials which automatically detects:
 * - OIDC environment (Railway provides OIDC_TOKEN)
 * - Workload Identity Federation setup
 * - Service account email and identity provider
 */
function initializeGCS(): { storage: Storage; bucket: Bucket } {
  if (storage && bucket) {
    return { storage, bucket };
  }

  try {
    // Initialize Storage client with Workload Identity Federation
    // ADC will automatically use OIDC_TOKEN from Railway environment
    storage = new Storage({
      projectId: GOOGLE_CLOUD_PROJECT || GCS_PROJECT_ID,
    });

    bucket = storage.bucket(GCS_BUCKET_NAME);

    // Determine which authentication method is being used
    if (GOOGLE_WORKLOAD_IDENTITY_PROVIDER && GOOGLE_SERVICE_ACCOUNT_EMAIL) {
      authMethod = "Workload Identity Federation (OIDC)";
      console.log(`[GCS] Using Workload Identity Federation`);
      console.log(`[GCS]   - Identity Provider: ${GOOGLE_WORKLOAD_IDENTITY_PROVIDER}`);
      console.log(`[GCS]   - Service Account: ${GOOGLE_SERVICE_ACCOUNT_EMAIL}`);
    } else {
      authMethod = "Application Default Credentials (ADC)";
      console.log(`[GCS] Using Application Default Credentials`);
      console.log(`[GCS] ⚠️  For production, ensure GOOGLE_WORKLOAD_IDENTITY_PROVIDER and GOOGLE_SERVICE_ACCOUNT_EMAIL are set`);
    }

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
      console.error(`[GCS] Error checking bucket:`, error.message);
      console.error(`[GCS] Error details:`, error);
      // Don't throw - allow app to start, but uploads will fail
    });

    console.log(`[GCS] Initialized successfully with auth method: ${authMethod}`);
    console.log(`[GCS]   Project: ${GOOGLE_CLOUD_PROJECT || GCS_PROJECT_ID}, Bucket: ${GCS_BUCKET_NAME}`);
    
    return { storage, bucket };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logError("Failed to initialize Google Cloud Storage", error);
    
    // Provide helpful debugging information
    console.error(`[GCS] Initialization failed: ${errorMessage}`);
    console.error(`[GCS] Configuration:`);
    console.error(`[GCS]   - GOOGLE_CLOUD_PROJECT: ${GOOGLE_CLOUD_PROJECT || "not set"}`);
    console.error(`[GCS]   - GCS_PROJECT_ID (fallback): ${GCS_PROJECT_ID}`);
    console.error(`[GCS]   - GCS_BUCKET_NAME: ${GCS_BUCKET_NAME || "not set"}`);
    console.error(`[GCS]   - GOOGLE_WORKLOAD_IDENTITY_PROVIDER: ${GOOGLE_WORKLOAD_IDENTITY_PROVIDER ? "set" : "not set"}`);
    console.error(`[GCS]   - GOOGLE_SERVICE_ACCOUNT_EMAIL: ${GOOGLE_SERVICE_ACCOUNT_EMAIL ? "set" : "not set"}`);
    console.error(`[GCS] Ensure Workload Identity Federation is configured in Google Cloud`);
    
    throw new Error(
      `GCS initialization failed: ${errorMessage}. ` +
      "Check that Workload Identity Federation is configured and OIDC_TOKEN is available."
    );
  }
}

/**
 * Get the current authentication method
 */
export function getAuthMethod(): string {
  return authMethod;
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
 * 
 * For Workload Identity Federation:
 * - GOOGLE_CLOUD_PROJECT: GCP project ID
 * - GCS_BUCKET_NAME: GCS bucket name
 * - GOOGLE_WORKLOAD_IDENTITY_PROVIDER: Identity provider URL (format: projects/PROJECT_ID/locations/global/workloadIdentityPools/POOL_ID/providers/PROVIDER_ID)
 * - GOOGLE_SERVICE_ACCOUNT_EMAIL: Service account email (format: sa-name@project.iam.gserviceaccount.com)
 * 
 * OIDC_TOKEN will be automatically provided by Railway in OIDC environment
 */
export function validateGCSConfig(): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required for both methods
  if (!GCS_BUCKET_NAME) {
    errors.push("GCS_BUCKET_NAME is not set");
  }

  const projectId = GOOGLE_CLOUD_PROJECT || GCS_PROJECT_ID;
  if (!projectId) {
    errors.push("GOOGLE_CLOUD_PROJECT or GCS_PROJECT_ID must be set");
  }

  // Workload Identity Federation specific
  if (!GOOGLE_WORKLOAD_IDENTITY_PROVIDER) {
    warnings.push("GOOGLE_WORKLOAD_IDENTITY_PROVIDER is not set - Workload Identity Federation not configured");
  } else {
    // Validate format of identity provider
    if (!GOOGLE_WORKLOAD_IDENTITY_PROVIDER.includes("workloadIdentityPools")) {
      errors.push("GOOGLE_WORKLOAD_IDENTITY_PROVIDER format invalid - should be: projects/PROJECT_ID/locations/global/workloadIdentityPools/POOL_ID/providers/PROVIDER_ID");
    }
  }

  if (!GOOGLE_SERVICE_ACCOUNT_EMAIL) {
    warnings.push("GOOGLE_SERVICE_ACCOUNT_EMAIL is not set - Workload Identity Federation not configured");
  } else {
    // Validate format of service account email
    if (!GOOGLE_SERVICE_ACCOUNT_EMAIL.includes("@") || !GOOGLE_SERVICE_ACCOUNT_EMAIL.endsWith(".iam.gserviceaccount.com")) {
      errors.push("GOOGLE_SERVICE_ACCOUNT_EMAIL format invalid - should be: sa-name@project.iam.gserviceaccount.com");
    }
  }

  // Check if OIDC token is available in Railway environment
  if (!process.env.OIDC_TOKEN) {
    warnings.push("OIDC_TOKEN not available - ensure running in Railway with OIDC enabled");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

