import OpenAI from "openai";

const client = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

export async function analyzeSentiment(deal) {
  const lastMessage = deal.messages[deal.messages.length - 1];
  if (!lastMessage) {
    return { sentimentScore: 0.5, tone: "neutral" };
  }

  const prompt = `
Analyze the sentiment of the last message in this deal thread.

Last Message: "${lastMessage.body}"

Return JSON with:
- "sentimentScore": A float between 0.0 (very negative) and 1.0 (very positive).
- "tone": A single word classification (e.g., "assertive", "uncertain", "rushed", "collaborative", "positive").
`;

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const data = JSON.parse(completion.choices[0].message.content);
    return { sentimentScore: data.sentimentScore ?? 0.5, tone: data.tone ?? "neutral" };
  } catch (error) {
    console.error("Sentiment Analysis Failed:", error);
    return { sentimentScore: 0.5, tone: "neutral" };
  }
}