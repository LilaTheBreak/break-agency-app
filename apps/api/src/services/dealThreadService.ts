import prisma from "../lib/prisma.js";
import { inferStageFromEmail } from "./dealStageService.js";
import { detectBrand } from "./brandService.js";
import { detectTalentForEmail } from "./dealTalentService.js";

function extractRootSubject(subject: string) {
  return (subject || "")
    .replace(/^(re:|fw:|fwd:)\s*/i, "")
    .trim()
    .toLowerCase();
}

export async function rebuildDealThreads(userId: string) {
  const emails = await prisma.ingestedEmail.findMany({
    where: { userId },
    orderBy: { receivedAt: "asc" }
  });

  const threads: Record<string, { root: string; brandEmail?: string; emails: any[] }> = {};

  for (const email of emails) {
    const root = extractRootSubject(email.subject || "");
    const brandEmail = (email.raw?.from || email.from || "").toLowerCase() || undefined;
    const key = `${root}|${brandEmail || ""}`;

    if (!threads[key]) {
      threads[key] = { root, brandEmail, emails: [] };
    }
    threads[key].emails.push(email);
  }

  // clear existing threads for user before rebuild
  await prisma.dealThreadEmail.deleteMany({
    where: { thread: { userId } }
  });
  await prisma.dealThread.deleteMany({ where: { userId } });

  const saved = [];
  for (const threadKey of Object.keys(threads)) {
    const t = threads[threadKey];
    const latest = t.emails[t.emails.length - 1];
    const stage = latest ? inferStageFromEmail(latest) : "NEW_LEAD";
    const brand = latest ? await detectBrand(latest) : null;
    const talents = latest ? await detectTalentForEmail(latest) : [];
    const thread = await prisma.dealThread.create({
      data: {
        userId,
        brandName: undefined,
        brandEmail: t.brandEmail,
        subjectRoot: t.root,
        stage,
        brandId: brand?.id,
        talentIds: talents,
        emails: {
          create: t.emails.map((e: any) => ({
            emailId: e.id,
            subject: e.subject,
            snippet: e.snippet,
            receivedAt: e.receivedAt
          }))
        }
      }
    });
    saved.push(thread);
  }

  return saved;
}

export async function getThreads(userId: string) {
  const threads = await prisma.dealThread.findMany({
    where: { userId },
    include: {
      emails: {
        orderBy: { receivedAt: "asc" }
      },
      brand: true
    },
    orderBy: { updatedAt: "desc" }
  });
  return hydrateAssignments(threads);
}

export async function getDealsWithFilters(user: any, filters: { talentId?: string; brandId?: string; stage?: string; status?: string }) {
  const where: any = {};

  const roles = (user.roles || []).map((r: any) => (typeof r === "string" ? r.toLowerCase() : r?.role?.name?.toLowerCase())).filter(Boolean);
  const isAdmin = roles.includes("admin");
  if (!isAdmin) {
    where.agentIds = { has: user.id };
  }

  if (filters.talentId) {
    where.talentIds = { has: filters.talentId };
  }
  if (filters.brandId) {
    where.brandId = filters.brandId;
  }
  if (filters.stage) {
    where.stage = filters.stage.toUpperCase();
  }
  if (filters.status) {
    where.status = filters.status.toLowerCase();
  }

  const threads = await prisma.dealThread.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: { brand: true }
  });
  return hydrateAssignments(threads);
}

export async function getThread(userId: string, threadId: string) {
  const thread = await prisma.dealThread.findFirst({
    where: { id: threadId, userId },
    include: {
      emails: { orderBy: { receivedAt: "asc" } },
      brand: true
    }
  });
  if (!thread) return null;
  const [hydrated] = await hydrateAssignments([thread]);
  return hydrated;
}

export async function updateDealThreadStage(userId: string, email: any) {
  const root = extractRootSubject(email?.subject || "");
  const brand = (email?.raw?.from || email?.from || "").toLowerCase() || undefined;

  const thread = await prisma.dealThread.findFirst({
    where: { subjectRoot: root, brandEmail: brand, userId }
  });

  if (!thread) return;

  const stage = inferStageFromEmail(email || {});
  const order = [
    "NEW_LEAD",
    "BRIEF_RECEIVED",
    "NEGOTIATING",
    "PENDING_CONTRACT",
    "CONTRACT_SENT",
    "LIVE",
    "CONTENT_SUBMITTED",
    "APPROVED",
    "PAYMENT_SENT",
    "CLOSED_WON",
    "CLOSED_LOST"
  ];

  if (order.indexOf(stage) > order.indexOf(thread.stage)) {
    await prisma.dealThread.update({
      where: { id: thread.id },
      data: { stage }
    });
    await prisma.dealEvent.create({
      data: {
        dealId: thread.id,
        type: "STAGE_CHANGE",
        actorId: userId,
        message: `Stage changed: ${thread.stage} → ${stage}`,
        metadata: { oldStage: thread.stage, newStage: stage }
      }
    });
  }
}

export async function updateDealThreadAssociations(userId: string, email: any) {
  const root = extractRootSubject(email?.subject || "");
  const brandEmail = (email?.raw?.from || email?.from || "").toLowerCase() || undefined;

  const thread = await prisma.dealThread.findFirst({
    where: { subjectRoot: root, brandEmail, userId }
  });
  if (!thread) return;

  const brand = await detectBrand(email);
  const talentIds = await detectTalentForEmail(email);

  await prisma.dealThread.update({
    where: { id: thread.id },
    data: {
      brandId: brand?.id,
      talentIds,
      agentIds: [] // placeholder until agent-talent mapping is defined
    }
  });
}

async function hydrateAssignments(threads: Array<any>) {
  const allTalentIds = Array.from(new Set(threads.flatMap((t) => t.talentIds || [])));
  const allAgentIds = Array.from(new Set(threads.flatMap((t) => t.agentIds || [])));

  const users = await prisma.user.findMany({
    where: { id: { in: [...allTalentIds, ...allAgentIds] } },
    select: { id: true, name: true, email: true }
  });
  const byId = new Map(users.map((u) => [u.id, u]));

  return threads.map((t) => ({
    ...t,
    talentProfiles: (t.talentIds || []).map((id: string) => byId.get(id)).filter(Boolean),
    agentProfiles: (t.agentIds || []).map((id: string) => byId.get(id)).filter(Boolean)
  }));
}
