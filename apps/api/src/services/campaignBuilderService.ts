import OpenAI from "openai";
import prisma from "../lib/prisma.js";
import { safeEnv } from "../utils/safeEnv.js";

const OPENAI_API_KEY = safeEnv("OPENAI_API_KEY", "");
const OPENAI_MODEL = safeEnv("OPENAI_MODEL", "gpt-4o-mini");
const client = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

export async function buildCampaignFromDeal(dealDraftId: string) {
  const deal = await prisma.dealDraft.findUnique({
    where: { id: dealDraftId },
    include: { user: true }
  });
  if (!deal) throw new Error("DealDraft not found");

  const prompt = `You are a senior influencer campaign producer.\nCreate a structured plan for the campaign.\n\nINPUT:\n${JSON.stringify(deal.rawJson || {}, null, 2)}\n\nReturn STRICT JSON:\n{\n  "title": string,\n  "summary": string,\n  "timeline": [{ "date": string, "task": string }],\n  "deliverables": [{ "title": string, "type": "post" | "story" | "video" | "event" | "ugc" | "report" | "asset", "dueDate": string }],\n  "approvals": [{ "title": string, "dueDate": string }],\n  "brief": { "title": string, "content": string }\n}`;

  const response =
    client &&
    (await client.chat.completions.create({
      model: OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.2,
      messages: [{ role: "user", content: prompt }]
    }));

  const data = response?.choices?.[0]?.message?.content ? JSON.parse(response.choices[0].message.content) : fallbackPlan();

  const campaign = await prisma.campaign.create({
    data: {
      title: data.title || "Auto campaign",
      aiGenerated: true,
      aiSummary: data.summary || "",
      timeline: data.timeline || [],
      deliverablePlan: data.deliverables || [],
      creatorTeams: { users: [deal.userId] }
    }
  });

  for (const d of data.deliverables || []) {
    await prisma.deliverable.create({
      data: {
        title: d.title || "Deliverable",
        role: "creator",
        dueDate: d.dueDate ? new Date(d.dueDate) : null,
        campaignId: campaign.id,
        metadata: d
      }
    });
  }

  for (const t of data.timeline || []) {
    await prisma.task.create({
      data: {
        title: t.task || "Task",
        dueDate: t.date ? new Date(t.date) : null,
        role: "creator",
        campaignId: campaign.id
      }
    });
  }

  for (const a of data.approvals || []) {
    await prisma.approval.create({
      data: {
        title: a.title || "Approval",
        type: "asset",
        role: "creator",
        campaignId: campaign.id,
        dueDate: a.dueDate ? new Date(a.dueDate) : null
      }
    });
  }

  if (data.brief) {
    await prisma.brief.create({
      data: {
        title: data.brief.title || "Campaign brief",
        metadata: {},
        role: "creator",
        versions: {
          create: [
            {
              versionNumber: 1,
              data: { content: data.brief.content || "" }
            }
          ]
        }
      }
    });
  }

  return { campaign };
}

function fallbackPlan() {
  return {
    title: "Auto campaign",
    summary: "AI key missing; basic structure created.",
    timeline: [],
    deliverables: [],
    approvals: [],
    brief: { title: "Campaign brief", content: "" }
  };
}
