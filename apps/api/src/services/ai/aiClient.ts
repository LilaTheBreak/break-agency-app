import { safeEnv } from "../../utils/safeEnv.js";

const OPENAI_API_KEY = safeEnv("OPENAI_API_KEY", "dev-openai-key");
const OPENAI_MODEL = safeEnv("OPENAI_MODEL", "gpt-4o-mini");

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export async function safeModel(prompt: string): Promise<unknown> {
  if (!OPENAI_API_KEY || OPENAI_API_KEY === "dev-openai-key") {
    return fallback(prompt);
  }

  const messages: ChatMessage[] = [
    {
      role: "system",
      content:
        "You extract structured, non-binding summaries. Never give legal, financial, or medical advice. Respond with strict JSON only."
    },
    { role: "user", content: prompt }
  ];

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
    throw new Error("AI returned empty response");
  }
  const normalized = content.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  return JSON.parse(normalized);
}

export const aiClient = {
  json: (prompt: string) => safeModel(prompt),
  text: (prompt: string) => safeModel(prompt)
};

function fallback(prompt: string) {
  return {
    summary: `AI disabled. Provide manual summary for: ${prompt.slice(0, 120)}...`,
    confidence: 0.1,
    redFlags: ["Live AI is offline; review details manually."]
  } as unknown;
}
