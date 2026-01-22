import { Storage } from "@google-cloud/storage";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import { safeEnv } from '../../utils/safeEnv.js';

/**
 * File Extraction Service with Workload Identity Federation
 * 
 * Extracts text from PDF, DOCX, and text files stored in GCS.
 * Authenticates via Workload Identity Federation (OIDC) - no JSON keys required.
 */

const GCS_PROJECT_ID = process.env.GCS_PROJECT_ID || "break-agency-storage";
const GCS_BUCKET_NAME = process.env.GCS_BUCKET_NAME || "break-agency-app-storage";
const GOOGLE_CLOUD_PROJECT = process.env.GOOGLE_CLOUD_PROJECT;

/**
 * Get GCS Storage client using Workload Identity Federation
 * 
 * ADC automatically detects and uses OIDC credentials from Railway environment.
 * No service account JSON keys are required.
 */
function getStorageClient(): Storage {
  try {
    return new Storage({
      projectId: GOOGLE_CLOUD_PROJECT || GCS_PROJECT_ID,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[FileExtractor] Failed to initialize Storage client:", errorMessage);
    console.error("[FileExtractor] Ensure Workload Identity Federation is configured in Google Cloud");
    throw new Error(`Storage client initialization failed: ${errorMessage}`);
  }
}

export async function extractTextFromFile(key: string): Promise<string> {
  try {
    const storage = getStorageClient();
    const bucket = storage.bucket(GCS_BUCKET_NAME);
    const file = bucket.file(key);
    
    const [buffer] = await file.download();

    if (key.toLowerCase().endsWith(".pdf")) {
      const pdf = await pdfParse(buffer);
      return pdf.text;
    }

    if (key.toLowerCase().endsWith(".docx")) {
      const text = await extractDocxText(buffer);
      return text;
    }

    return buffer.toString("utf8");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[FileExtractor] Failed to extract text from ${key}:`, errorMessage);
    throw error;
  }
}

async function extractDocxText(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || "";
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[FileExtractor] DOCX extraction failed:", errorMessage);
    return "";
  }
}
