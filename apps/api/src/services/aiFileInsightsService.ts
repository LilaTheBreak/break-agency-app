import { cleanText, splitIntoChunks } from '../lib/fileExtract';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

export class InvalidAiResponseError extends Error {}

type FileMetadata = {
  detectedType?: string;
  parties?: string[];
  dates?: string[];
  keywords?: string[];
  amountValues?: string[];
  brandNames?: string[];
};

type FileInsights = {
  summary?: string;
  metadata?: FileMetadata;
  supportingTextSnippets?: string[];
  confidence?: number;
};

export async function generateFileInsights({
  text,
  filename,
  detectedType
}: {
  text: string;
  filename?: string;
  detectedType?: string;
}): Promise<FileInsights & { success: boolean }> {
  const trimmed = cleanText(text || "").slice(0, 20000);
  const chunks = splitIntoChunks(trimmed, 1800);

  if (!OPENAI_API_KEY) {
    return {
      success: true,
      ...buildHeuristicInsights(trimmed, filename, detectedType)
    };
  }

  const systemPrompt = `You are an AI that provides non-authoritative summaries and metadata for user-uploaded files. Keep responses concise, avoid legal conclusions, contract interpretation, binding instructions, or personal data reshaping. Output strict JSON with keys: summary, metadata { detectedType, parties, dates, keywords, amountValues, brandNames }, supportingTextSnippets, confidence (0-1). Emphasize safety: everything is suggestive only.`;

  const userContent = `Filename: ${filename || "unknown"}\nDetected type: ${detectedType || "unknown"}\n\nContent chunks (truncate after 20k chars):\n${chunks
    .slice(0, 8)
    .map((chunk, idx) => `Chunk ${idx + 1}: ${chunk}`)
    .join("\n\n")}`;

  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userContent }
  ];

  const raw = await callOpenAI(messages);
  const parsed = parseAiJson(raw);
  if (!parsed) {
    throw new InvalidAiResponseError("AI returned invalid JSON");
  }

  return {
    success: true,
    summary: parsed.summary || "",
    metadata: parsed.metadata || {},
    supportingTextSnippets: parsed.supportingTextSnippets || [],
    confidence: typeof parsed.confidence === "number" ? parsed.confidence : undefined
  };
}

async function callOpenAI(messages: Array<{ role: string; content: string }>): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages,
      temperature: 0.2,
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || "AI provider unavailable");
  }
  const payload = await response.json().catch(() => null);
  const content = payload?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("AI returned an empty response");
  }
  return content;
}

function parseAiJson(raw: string): FileInsights | null {
  try {
    const normalized = raw.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
    const parsed = JSON.parse(normalized);
    if (typeof parsed !== "object" || parsed === null) return null;
    return parsed as FileInsights;
  } catch (error) {
    return null;
  }
}

function buildHeuristicInsights(text: string, filename?: string, detectedType?: string): FileInsights {
  const dates = uniqMatches(text.match(/\b\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}\b/g));
  const isoDates = uniqMatches(text.match(/\b\d{4}-\d{2}-\d{2}\b/g));
  const money = uniqMatches(text.match(/[$€£]\s?\d+[\d,]*(?:\.\d{2})?/g));
  const keywords = uniqMatches(
    text
      .split(/[^a-zA-Z]+/g)
      .filter((word) => word.length > 4)
      .slice(0, 30)
  ).slice(0, 8);

  const summary = text.length ? `${text.slice(0, 260)}${text.length > 260 ? "…" : ""}` : "No extractable text available.";

  return {
    summary,
    metadata: {
      detectedType: detectedType || guessTypeFromFilename(filename),
      parties: [],
      dates: [...dates, ...isoDates].slice(0, 5),
      keywords,
      amountValues: money.slice(0, 5),
      brandNames: []
    },
    supportingTextSnippets: text ? [text.slice(0, 1800)] : [],
    confidence: 0.15
  };
}

function guessTypeFromFilename(filename?: string) {
  const ext = (filename?.split(".").pop() || "").toLowerCase();
  if (ext === "pdf" || ext === "docx") return "contract";
  if (["csv", "xlsx"].includes(ext)) return "brief";
  return "unknown";
}

function uniqMatches(matches: string[] | null | undefined) {
  return Array.from(new Set(matches || [])).map((item) => item.trim()).filter(Boolean);
}
