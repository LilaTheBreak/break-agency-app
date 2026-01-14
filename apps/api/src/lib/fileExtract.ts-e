import { fileTypeFromBuffer } from "file-type";

type SupportedFileType = "pdf" | "docx" | "image" | "txt" | "csv" | "binary";

export async function detectFileType(buffer: Buffer, filename?: string): Promise<SupportedFileType> {
  const ext = (filename?.split(".").pop() || "").toLowerCase();

  const type = await fileTypeFromBuffer(buffer).catch(() => null);
  if (type?.mime === "application/pdf") return "pdf";
  if (type?.mime?.startsWith("image/")) return "image";
  if (type?.mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") return "docx";

  if (buffer.slice(0, 4).toString() === "%PDF") return "pdf";
  if (buffer.slice(0, 2).toString() === "PK" && ext === "docx") return "docx";

  if (["png", "jpg", "jpeg", "gif", "tiff", "bmp", "webp"].includes(ext)) return "image";
  if (ext === "pdf") return "pdf";
  if (ext === "docx") return "docx";
  if (ext === "csv") return "csv";
  if (["txt", "md", "json", "log"].includes(ext)) return "txt";

  return "binary";
}

export async function extractText(buffer: Buffer, type: SupportedFileType): Promise<string> {
  switch (type) {
    case "pdf":
      return extractPdf(buffer);
    case "docx":
      return extractDocx(buffer);
    case "image":
      return extractWithTesseract(buffer);
    case "csv":
    case "txt":
      return buffer.toString("utf-8");
    default: {
      const text = buffer.toString("utf-8");
      return text.replace(/[^\x09\x0A\x0D\x20-\x7E]+/g, " ");
    }
  }
}

export function cleanText(raw: string): string {
  if (!raw) return "";
  return raw
    .replace(/\r\n?/g, "\n")
    .replace(/\u0000/g, " ")
    .replace(/[\t ]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function splitIntoChunks(text: string, chunkSize = 2000): string[] {
  if (!text) return [];
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize));
  }
  return chunks;
}

async function extractPdf(buffer: Buffer): Promise<string> {
  const pdfParse = (await import("pdf-parse")).default as unknown as (input: Buffer) => Promise<{ text: string }>;
  const result = await pdfParse(buffer);
  return result.text || "";
}

async function extractDocx(buffer: Buffer): Promise<string> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  return (result.value || result.messages?.join(" ") || "").toString();
}

async function extractWithTesseract(buffer: Buffer): Promise<string> {
  const Tesseract = (await import("tesseract.js")).default as unknown as typeof import("tesseract.js");
  const result = await Tesseract.recognize(buffer, "eng", { logger: () => undefined });
  return result?.data?.text || "";
}
