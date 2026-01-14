import pdfParse from "pdf-parse";
import textract from "textract";
import { sendSlackAlert } from '../integrations/slack/slackClient.js';
import { getDownloadUrl } from './fileService.js';
import { extractImageText } from './ocrService.js';

export async function extractDocumentText({
  fileId,
  userId,
  isAdmin
}: {
  fileId: string;
  userId: string;
  isAdmin: boolean;
}) {
  try {
    const file = await getDownloadUrl(fileId, userId, isAdmin);
    const response = await fetch(file.url);
    if (!response.ok) {
      throw new Error("Unable to download file");
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const text = await extractBufferToText(buffer, file.filename || "document" );

    return { text };
  } catch (error) {
    await sendSlackAlert("Document extraction failed", { error: `${error}`, fileId });
    throw error;
  }
}

async function extractBufferToText(buffer: Buffer, filename: string): Promise<string> {
  const ext = (filename.split(".").pop() || "").toLowerCase();
  if (ext === "pdf") {
    const result = await pdfParse(buffer);
    return (result.text || "").trim();
  }

  if (["doc", "docx", "rtf", "ppt", "pptx"].includes(ext)) {
    return new Promise<string>((resolve, reject) => {
      textract.fromBufferWithName(filename, buffer, { preserveLineBreaks: true, ocr: false }, (err, text) => {
        if (err) return reject(err);
        resolve((text || "").trim());
      });
    });
  }

  if (["png", "jpg", "jpeg", "webp", "bmp", "tiff"].includes(ext)) {
    return extractImageText(buffer);
  }

  return buffer.toString("utf-8");
}
