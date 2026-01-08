import { z } from "zod";
import prisma from "../lib/prisma.js";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

const breakdownSchema = z.object({
  engagementSummary: z.string().optional().default(""),
  growthSummary: z.string().optional().default(""),
  contentThemes: z.array(z.string()).optional().default([]),
  bestTimes: z.array(z.string()).optional().default([]),
  platformSpecific: z.record(z.string(), z.unknown()).optional().default({}),
  benchmarkNotes: z.array(z.string()).optional().default([]),
  confidence: z.number().min(0).max(1).optional().default(0.3)
});

export class InvalidSocialAiResponseError extends Error {}

export async function generateSocialInsights(userId: string) {
  const dataset = await buildDataset(userId);

  if (!OPENAI_API_KEY) {
    return { success: true, breakdown: heuristicBreakdown(dataset) };
  }

  const systemPrompt =
    "You summarise social performance for creators. Provide concise, non-prescriptive insights only. Avoid private data, financial claims, medical claims, or algorithm speculation. No directives—only pattern descriptions and gentle suggestions. Output valid JSON matching the required shape.";

  const userPrompt = `Here is structured social data (90d analytics and latest posts). Respond with JSON: { success: true, breakdown: { engagementSummary, growthSummary, contentThemes, bestTimes, platformSpecific, benchmarkNotes, confidence } }.
Data: ${JSON.stringify(dataset).slice(0, 12000)}`;

  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt }
  ];

  const raw = await callOpenAI(messages);
  const parsed = parseResponse(raw);
  if (!parsed) {
    throw new InvalidSocialAiResponseError("AI returned invalid JSON");
  }
  return { success: true, breakdown: parsed.breakdown };
}

async function buildDataset(userId: string) {
  const ninetyDaysAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 90);

  // FIXED: Use SocialMetric model instead of non-existent socialAnalytics
  const metrics = await prisma.socialMetric.findMany({
    where: { 
      snapshotDate: { gte: ninetyDaysAgo },
      profile: {
        connection: {
          creatorId: userId
        }
      }
    },
    include: { 
      profile: { 
        include: { 
          connection: { 
            select: { platform: true } 
          } 
        } 
      } 
    },
    orderBy: { snapshotDate: "desc" }
  });

  // FIXED: SocialPost uses profileId, not userId
  const posts = await prisma.socialPost.findMany({
    where: { 
      profile: {
        connection: {
          creatorId: userId
        }
      }
    },
    orderBy: { postedAt: "desc" },
    take: 100
  });

  const followerHistory = metrics
    .filter((entry) => entry.metricType === "followerCount")
    .map((entry) => ({
      capturedAt: entry.snapshotDate,
      followerCount: entry.value,
      platform: entry.profile?.connection?.platform
    }));

  const engagementHistory = metrics
    .filter((entry) => entry.metricType === "engagementRate")
    .map((entry) => ({
      capturedAt: entry.snapshotDate,
      engagementRate: entry.value,
      platform: entry.profile?.connection?.platform
    }));

  const impressions = metrics
    .filter((entry) => entry.metricType === "impressions")
    .map((entry) => ({
      capturedAt: entry.snapshotDate,
      impressions: entry.value,
      platform: entry.profile?.connection?.platform
    }));

  const normalizedPosts = posts.map((post) => ({
    caption: (post.caption || "").slice(0, 300),
    likes: (post as any).likes ?? 0,
    comments: (post as any).comments ?? 0,
    views: (post as any).views ?? 0,
    engagementRate: (post as any).engagementRate ?? null,
    postedAt: post.postedAt,
    platform: post.platform
  }));

  const platforms = Array.from(
    new Set([
      // analyticsHistory is not available - comment out
      ...posts.map((post) => post.platform).filter(Boolean)
    ])
  );

  return {
    followerHistory,
    engagementHistory,
    impressions,
    posts: normalizedPosts,
    platforms
  };
}

async function callOpenAI(messages: Array<{ role: string; content: string }>): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ model: OPENAI_MODEL, messages, temperature: 0.25, response_format: { type: "json_object" } })
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

function parseResponse(raw: string) {
  try {
    const normalized = raw.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
    const parsed = JSON.parse(normalized);
    if (typeof parsed !== "object" || !parsed) return null;
    const result = breakdownSchema.safeParse(parsed.breakdown ?? parsed);
    if (!result.success) return null;
    return { success: true, breakdown: result.data };
  } catch (error) {
    return null;
  }
}

function heuristicBreakdown(dataset: Awaited<ReturnType<typeof buildDataset>>): z.infer<typeof breakdownSchema> {
  const engagementRates = dataset.engagementHistory.map((item) => item.engagementRate || 0).filter(Boolean);
  const avgEngagement = engagementRates.length
    ? engagementRates.reduce((sum, value) => sum + value, 0) / engagementRates.length
    : 0;

  const followerChange = (() => {
    if (!dataset.followerHistory.length) return 0;
    const sorted = [...dataset.followerHistory].sort((a, b) => a.capturedAt.getTime() - b.capturedAt.getTime());
    return (sorted[sorted.length - 1].followerCount ?? 0) - (sorted[0].followerCount ?? 0);
  })();

  const contentThemes = extractTopWords(dataset.posts.map((post) => post.caption).join(" "));
  const bestTimes = computeBestTimes(dataset.posts);

  return {
    engagementSummary: avgEngagement
      ? `Typical engagement sits around ${avgEngagement.toFixed(2)}%, with room to keep lifting interaction quality.`
      : "Engagement signals are limited; connect more accounts to see clearer patterns.",
    growthSummary: followerChange
      ? `Followers shifted by ${followerChange >= 0 ? "+" : ""}${followerChange} over the last window.`
      : "Growth trend is unclear due to limited history.",
    contentThemes: contentThemes.slice(0, 6),
    bestTimes,
    platformSpecific: {},
    benchmarkNotes: ["Insights are heuristic because live AI is disabled."],
    confidence: 0.2
  };
}

function extractTopWords(text: string) {
  if (!text) return [] as string[];
  const counts: Record<string, number> = {};
  text
    .toLowerCase()
    .split(/[^a-z]+/g)
    .filter((word) => word.length > 4)
    .forEach((word) => {
      counts[word] = (counts[word] || 0) + 1;
    });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([word]) => word);
}

function computeBestTimes(posts: Array<{ postedAt: Date | null; likes: number; comments: number; views: number }>) {
  if (!posts?.length) return [] as string[];
  const buckets: Record<string, number[]> = {};
  posts.forEach((post) => {
    if (!post.postedAt) return;
    const date = new Date(post.postedAt);
    const day = date.toLocaleDateString("en-US", { weekday: "short" });
    const hour = date.getHours();
    const slot = `${day} ${hour.toString().padStart(2, "0")}:00`;
    const score = (post.likes ?? 0) + (post.comments ?? 0) + (post.views ?? 0) * 0.1;
    buckets[slot] = buckets[slot] ? [...buckets[slot], score] : [score];
  });
  const averages = Object.entries(buckets).map(([slot, values]) => ({
    slot,
    avg: values.reduce((sum, v) => sum + v, 0) / values.length
  }));
  return averages
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 5)
    .map((entry) => `${entry.slot} (historically stronger engagement)`);
}
