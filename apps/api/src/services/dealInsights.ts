import prisma from "../lib/prisma.js";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

type InsightResponse = {
  summary: string;
  risk_level: "GREEN" | "AMBER" | "RED" | string;
  next_steps: string[];
  missing_items: string[];
  due_dates: string[];
  recommended_reply: string;
};

export async function generateDealInsights(dealId: string): Promise<{ insights: InsightResponse }> {
  const deal = await prisma.dealThread.findUnique({
    where: { id: dealId },
    include: {
      brand: true,
      emails: { orderBy: { receivedAt: "asc" } },
      events: { orderBy: { createdAt: "asc" } }
    }
  });

  if (!deal) throw new Error("Deal not found");

  const timelineText = deal.events
    .map((e) => `[${e.createdAt.toISOString()}] (${e.type}) ${e.message ?? ""}`)
    .join("\n");

  const prompt = `You are an expert talent manager. Provide transparent, non-legal insights. Avoid speculation beyond provided facts.\n\nGenerate JSON with keys: summary (string, 6-8 sentences), risk_level (GREEN|AMBER|RED), next_steps (string array), missing_items (string array), due_dates (string array), recommended_reply (string).\n\nTimeline:\n${timelineText || "No events logged yet."}`;

  if (!OPENAI_API_KEY) {
    return { insights: heuristicInsights(deal, timelineText) };
  }

  const messages = [
    { role: "system", content: "You summarise deal timelines for talent managers. Stay factual, no legal advice." },
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

  const payload = await response.json().catch(() => null);
  const content = payload?.choices?.[0]?.message?.content;
  if (!response.ok || !content) {
    return { insights: heuristicInsights(deal, timelineText) };
  }

  try {
    const parsed = JSON.parse(content);
    return { insights: normalizeInsights(parsed) };
  } catch {
    return { insights: heuristicInsights(deal, timelineText) };
  }
}

function normalizeInsights(raw: any): InsightResponse {
  return {
    summary: String(raw?.summary || "No summary available."),
    risk_level: raw?.risk_level || "AMBER",
    next_steps: Array.isArray(raw?.next_steps) ? raw.next_steps.map(String) : [],
    missing_items: Array.isArray(raw?.missing_items) ? raw.missing_items.map(String) : [],
    due_dates: Array.isArray(raw?.due_dates) ? raw.due_dates.map(String) : [],
    recommended_reply: String(raw?.recommended_reply || "")
  };
}

function heuristicInsights(deal: any, timelineText: string): InsightResponse {
  const lastEvent = deal.events[deal.events.length - 1];
  const daysSinceUpdate = lastEvent ? (Date.now() - new Date(lastEvent.createdAt).getTime()) / (1000 * 60 * 60 * 24) : null;
  const risk = daysSinceUpdate && daysSinceUpdate > 5 ? "RED" : daysSinceUpdate && daysSinceUpdate > 2 ? "AMBER" : "GREEN";
  return {
    summary: timelineText ? timelineText.slice(0, 800) : "No events logged yet.",
    risk_level: risk,
    next_steps: ["Follow up with brand if no response in past 48h.", "Confirm next milestone and owner."],
    missing_items: [],
    due_dates: [],
    recommended_reply: "Hi team, quick nudge on next steps. Are we aligned on timeline and approvals?"
  };
}
