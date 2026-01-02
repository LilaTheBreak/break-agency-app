import { Storage } from "@google-cloud/storage";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import { safeEnv } from "../../utils/safeEnv.js";

const GCS_PROJECT_ID = process.env.GCS_PROJECT_ID || "break-agency-storage";
const GCS_BUCKET_NAME = process.env.GCS_BUCKET_NAME || "break-agency-app-storage";
const GOOGLE_APPLICATION_CREDENTIALS_JSON = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

function getStorageClient(): Storage {
  if (!GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    throw new Error("GOOGLE_APPLICATION_CREDENTIALS_JSON is required");
  }
  const credentials = JSON.parse(GOOGLE_APPLICATION_CREDENTIALS_JSON);
  return new Storage({
    projectId: GCS_PROJECT_ID,
    credentials
  });
}

export async function extractTextFromFile(key: string): Promise<string> {
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
}

async function extractDocxText(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || "";
  } catch {
    return "";
  }
}
