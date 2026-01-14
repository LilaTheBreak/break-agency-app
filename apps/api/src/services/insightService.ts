import OpenAI from "openai";
import prisma from '../lib/prisma';
import { safeEnv } from '../utils/safeEnv';

const OPENAI_API_KEY = safeEnv("OPENAI_API_KEY", "dev-openai-key");
const OPENAI_MODEL = safeEnv("OPENAI_MODEL", "gpt-4o-mini");
const client = OPENAI_API_KEY && OPENAI_API_KEY !== "dev-openai-key"
  ? new OpenAI({ apiKey: OPENAI_API_KEY })
  : null;

export async function generateCreatorInsights(userId: string) {
  // REMOVED: socialAnalytics and creatorInsights models do not exist in schema.prisma
  // Use CreatorInsight model instead (which exists in schema)
  
  // Try to get social metrics from existing SocialMetric model
  const metrics = await prisma.socialMetric.findMany({
    where: { 
      profile: {
        connection: {
          creatorId: userId
        }
      }
    },
    orderBy: { snapshotDate: "desc" },
    take: 5
  });

  const prompt = `You are an AI Creator Performance Analyst.\nEvaluate this creator's last 5 data points:\n\n${JSON.stringify(metrics, null, 2)}\n\nReturn strict JSON:\n{\n  "summary": string,\n  "opportunities": string,\n  "risks": string,\n  "contentIdeas": [string, string, string]\n}`;

  const response =
    OPENAI_API_KEY &&
    (await client!.chat.completions.create({
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

  // Use existing CreatorInsight model (note: singular, not plural)
  return prisma.creatorInsight.create({
    data: {
      id: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      creatorId: userId,
      insightType: "performance",
      title: "Performance Analysis",
      summary: data.summary,
      context: JSON.stringify({
        opportunities: data.opportunities,
        risks: data.risks,
        contentIdeas: data.contentIdeas
      }),
      metadata: {
        metricsCount: metrics.length,
        generatedAt: new Date().toISOString()
      },
      priority: 0
    }
  });
}
