import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  console.warn("⚠️  WARNING: OPENAI_API_KEY is missing in environment variables");
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY ?? "",
});

/**
 * Simple helper for chat completions.
 */
export async function generateChatCompletion(messages: Array<{ role: string; content: string }>) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
    temperature: 0.7,
  });

  return response.choices?.[0]?.message?.content ?? "";
}
