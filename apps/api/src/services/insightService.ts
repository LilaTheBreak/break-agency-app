import OpenAI from "openai";
import prisma from "../lib/prisma.js";
import { safeEnv } from "../utils/safeEnv.js";

const OPENAI_API_KEY = safeEnv("OPENAI_API_KEY", "dev-openai-key");
const OPENAI_MODEL = safeEnv("OPENAI_MODEL", "gpt-4o-mini");
const client = new OpenAI({ apiKey: OPENAI_API_KEY });

export async function generateCreatorInsights(userId: string) {
  const latest = await prisma.socialAnalytics.findMany({
    where: { userId },
    orderBy: { capturedAt: "desc" },
    take: 5
  });

  const prompt = `You are an AI Creator Performance Analyst.\nEvaluate this creator's last 5 data points:\n\n${JSON.stringify(latest, null, 2)}\n\nReturn strict JSON:\n{\n  "summary": string,\n  "opportunities": string,\n  "risks": string,\n  "contentIdeas": [string, string, string]\n}`;

  const response =
    OPENAI_API_KEY &&
    (await client.chat.completions.create({
      model: OPENAI_MODEL,
      temperature: 0.2,
      messages: [{ role: "user", content: prompt }]
    }));

  const data =
    (response?.choices?.[0]?.message?.content && JSON.parse(response.choices[0].message.content)) || {
      summary: "AI disabled; provide manual insight.",
      opportunities: "",
      risks: "",
      contentIdeas: []
    };

  return prisma.creatorInsights.create({
    data: {
      userId,
      followers: latest[0]?.followerCount || 0,
      engagementRate: latest[0]?.engagementRate || 0,
      impressions: latest[0]?.impressions || 0,
      reach: latest[0]?.reach || 0,
      summary: data.summary,
      opportunities: data.opportunities,
      risks: data.risks,
      contentIdeas: data.contentIdeas
    }
  });
}
