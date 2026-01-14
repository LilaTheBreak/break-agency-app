import { sendSlackAlert } from '../integrations/slack/slackClient.js';

type OcrWorker = {
  recognize: (image: Buffer) => Promise<{ data?: { text?: string } }>;
};

let workerPromise: Promise<OcrWorker> | null = null;

export async function extractImageText(buffer: Buffer): Promise<string> {
  try {
    const worker = await getWorker();
    const { data } = await worker.recognize(buffer);
    return (data?.text || "").trim();
  } catch (error) {
    await sendSlackAlert("OCR extraction failed", { error: `${error}` });
    throw error;
  }
}

async function getWorker(): Promise<OcrWorker> {
  if (!workerPromise) {
    workerPromise = initWorker();
  }
  return workerPromise;
}

async function initWorker(): Promise<OcrWorker> {
  const tesseract = await import("tesseract.js");
  const worker = await tesseract.createWorker("eng", 1, { logger: () => undefined });
  return worker as unknown as OcrWorker;
}
