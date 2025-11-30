import prisma from "../../lib/prisma.js";
import { safeEnv } from "../../utils/safeEnv.js";

const OPENAI_API_KEY = safeEnv("OPENAI_API_KEY", "dev-openai-key");
const OPENAI_MODEL = safeEnv("OPENAI_MODEL", "gpt-4o-mini");

const ROLE_PROMPTS: Record<string, string> = {
  admin:
    "You are the Admin AI assistant for Break Agency. Provide laser-focused operational guidance balancing queues, approvals, finance, and messaging. Recommend next steps, risk mitigations, and data-backed calls to action.",
  agent:
    "You are the Agent AI assistant for Break Agency. Focus on managing creator pipelines, briefs, and contracts. Offer actions that unblock negotiations, match creators, and manage deliverables.",
  talent:
    "You are the Creator AI assistant. Give practical recommendations that keep deliverables, messaging, and approvals on track for premium creators.",
  "exclusive-talent":
    "You are the Exclusive Talent AI copilot. Prioritize premium suggestions for top creators spanning campaigns, travel, and finance.",
  ugc:
    "You are the UGC Creator assistant. Provide actionable advice for hitting deliverables, responding to briefs, and optimizing workflow speed.",
  brand:
    "You are the Brand AI assistant. Help brand users prioritize briefs, budgets, and contract approvals across campaigns.",
  founder:
    "You are the Founder AI assistant. Give executive-level insights on growth, risk, and strategic focus across teams."
};

export async function getAssistantResponse({
  role,
  userId,
  contextId,
  userInput
}: {
  role: string;
  userId: string;
  contextId?: string;
  userInput: string;
}) {
  const normalizedRole = (role || "admin").toLowerCase();
  const prompt = ROLE_PROMPTS[normalizedRole] || ROLE_PROMPTS.admin;
  const contextData = await buildContext(normalizedRole, userId, contextId);
  const messages = [
    {
      role: "system",
      content: prompt
    },
    {
      role: "user",
      content: `Context: ${JSON.stringify(contextData)}\n\nQuestion: ${userInput}`
    }
  ];

  const text = await callOpenAI(messages);
  return {
    role: normalizedRole,
    response: text,
    context: contextData
  };
}

async function buildContext(role: string, userId: string, contextId?: string) {
  const [tasks, briefs, payouts, invoices] = await Promise.all([
    prisma.task.findMany({
      where: { OR: [{ role }, { role: "global" }, { role: undefined }] },
      orderBy: { dueDate: "asc" },
      take: 5
    }),
    prisma.brief.findMany({
      where: { OR: [{ role }, { role: "global" }, { role: undefined }] },
      orderBy: { updatedAt: "desc" },
      take: 5
    }),
    prisma.payout.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 3
    }),
    prisma.invoice.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 3
    })
  ]);

  const briefHighlight = contextId
    ? await prisma.brief.findUnique({ where: { id: contextId } }).catch(() => null)
    : null;

  return {
    snapshot: {
      tasks: tasks.map((task) => ({
        title: task.title,
        status: task.status,
        dueDate: task.dueDate
      })),
      briefs: briefs.map((brief) => ({
        title: brief.title,
        status: brief.status,
        updatedAt: brief.updatedAt
      })),
      finance: {
        payoutsPending: payouts.filter((payout) => payout.status !== "paid"),
        invoicesDue: invoices.filter((invoice) => invoice.status !== "paid")
      },
      contextBrief: briefHighlight
    }
  };
}

async function callOpenAI(messages: Array<{ role: string; content: string }>) {
  if (!OPENAI_API_KEY) {
    return fallbackResponse(messages[1]?.content || "");
  }
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages,
      temperature: 0.4
    })
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    return fallbackResponse(text || "Unable to get AI response");
  }
  const payload = await response.json().catch(() => null);
  const text =
    payload?.choices?.[0]?.message?.content ||
    "Unable to provide suggestions right now. Re-check input or try again.";
  return text;
}

function fallbackResponse(userInput: string) {
  return `Actionable suggestions could not be generated live. Focus on: ${userInput.slice(0, 80)}...`;
}
