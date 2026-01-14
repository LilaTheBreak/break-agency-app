import prisma from '../lib/prisma';
import OpenAI from "openai";
import { sendSlackAlert } from '../integrations/slack/slackClient';
import { syncCalendarEvent } from './calendarSyncService';
import { safeEnv } from '../utils/safeEnv';

const OPENAI_API_KEY = safeEnv("OPENAI_API_KEY", "");
const OPENAI_MODEL = safeEnv("OPENAI_MODEL", "gpt-4o-mini");
const ai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

export async function createDeliverable(dealId: string, payload: any) {
  return prisma.deliverableItem.create({
    data: { dealId, ...payload }
  });
}

export async function updateDeliverable(id: string, payload: any) {
  return prisma.deliverableItem.update({
    where: { id },
    data: payload
  });
}

export async function runDeliverableQA(deliverableId: string) {
  const d = await prisma.deliverableItem.findUnique({
    where: { id: deliverableId }
  });
  if (!d) throw new Error("Deliverable not found");

  const prompt = `
Act as an influencer marketing QA specialist.
Review this content and return JSON only:
\nDELIVERABLE:\n${JSON.stringify(d, null, 2)}
\nReturn:\n{
  "compliance_score": 0-1,
  "brand_fit_score": 0-1,
  "risks": [],
  "caption_issues": [],
  "final_recommendation": "",
  "summary": ""
}`;

  if (!ai) {
    const fallback = {
      compliance_score: 0.5,
      brand_fit_score: 0.5,
      risks: ["OpenAI key missing; provide manual review."],
      caption_issues: [],
      final_recommendation: "Manual review required.",
      summary: "AI disabled."
    };
    await prisma.deliverableItem.update({ where: { id: deliverableId }, data: { metadata: fallback as any } });
    return fallback;
  }

  const response = await ai.chat.completions.create({
    model: OPENAI_MODEL || "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: "You are an expert content QA reviewer." },
      { role: "user", content: prompt }
    ]
  });

  const result = JSON.parse(response.choices[0]?.message?.content || "{}");

  await prisma.deliverableItem.update({
    where: { id: deliverableId },
    data: { metadata: result as any }
  });

  return result;
}

export async function predictDeliverablePerformance(deliverableId: string) {
  const d = await prisma.deliverableItem.findUnique({
    where: { id: deliverableId }
  });
  if (!d) throw new Error("Deliverable not found");

  const prompt = `
Predict influencer content performance. Return JSON only.
\n${JSON.stringify(d, null, 2)}
\nReturn:\n{
  "expected_views": <number>,
  "expected_engagement_rate": <float>,
  "viral_probability": <0-1>,
  "confidence": <0-1>,
  "factors": [],
  "summary": ""
}`;

  if (!ai) {
    const fallback = {
      expected_views: 0,
      expected_engagement_rate: 0,
      viral_probability: 0.1,
      confidence: 0.1,
      factors: ["AI disabled; manual estimation required."],
      summary: "AI disabled."
    };
    await prisma.deliverableItem.update({ where: { id: deliverableId }, data: { metadata: fallback as any } });
    return fallback;
  }

  const response = await ai.chat.completions.create({
    model: OPENAI_MODEL || "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: "You are an expert social performance model." },
      { role: "user", content: prompt }
    ]
  });

  const data = JSON.parse(response.choices[0]?.message?.content || "{}");

  await prisma.deliverableItem.update({
    where: { id: deliverableId },
    data: { metadata: data as any }
  });

  if ((data.confidence ?? 1) < 0.2) {
    await sendSlackAlert("Low confidence deliverable prediction", { deliverableId });
  }

  return data;
}

export async function createDeliverablesFromContract(contractId: string) {
  const contract = await prisma.contractReview.findUnique({
    where: { id: contractId }
  });

  if (!contract) return { count: 0 };

  const deliverables = [
    {
      id: `deliv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: "Review Contract",
      description: "",
      dealId: "unknown",
      contractId,
      userId: contract.userId,
      dueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  ];

  if (!deliverables.length) return { count: 0 };

  const created = await prisma.deliverableItem.createMany({ data: deliverables });

  await sendSlackAlert("Deliverables auto-created from contract", {
    contractId,
    count: created.count
  });

  return created;
}

export async function updateDeliverableStatus(id: string, status: string) {
  const updated = await prisma.deliverableItem.update({
    where: { id },
    data: { status }
  });

  await syncDeliverableToCalendar(id);
  return updated;
}

export async function listDeliverablesForUser(userId: string) {
  return prisma.deliverableItem.findMany({
    where: { userId },
    orderBy: { dueAt: "asc" }
  });
}

export async function syncDeliverableToCalendar(deliverableId: string) {
  const deliverable = await prisma.deliverableItem.findUnique({ where: { id: deliverableId } });
  if (!deliverable || !deliverable.dueAt || !deliverable.userId) return;

  await syncCalendarEvent({
    userId: deliverable.userId,
    type: "DELIVERABLE_DUE",
    title: deliverable.title,
    date: deliverable.dueAt,
    metadata: { deliverableId }
  });
}
