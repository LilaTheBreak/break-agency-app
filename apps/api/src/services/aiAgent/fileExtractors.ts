import { s3 } from "../../lib/s3.js";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";

export async function extractTextFromFile(key: string): Promise<string> {
  const file = await s3.send(
    new GetObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key
    })
  );

  const buffer = await streamToBuffer(file.Body as any);

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

function streamToBuffer(stream: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: any[] = [];
    stream.on("data", (chunk: any) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
}

async function extractDocxText(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || "";
  } catch {
    return "";
  }
}
