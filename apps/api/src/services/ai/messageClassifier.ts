import { aiClient } from "./aiClient.js";

export async function classifyMessage({ text, platform }: { text: string; platform: string }) {
  const prompt = `
Classify this inbound ${platform} message for a talent manager.
Message: """${text}"""

Return JSON:
{
  "category": "...",        // deal|invite|pr|gifting|spam|fan_message|other
  "brand": "...",
  "urgency": "...",
  "action": "...",
  "confidence": 0-1,
  "raw": {}
}
`;

  return aiClient.json(prompt);
}
