import { Router } from "express";
import { outreachQueue } from '../worker/queues.js';
import prisma from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/adminAuth.js';
import { generateLeadProspects } from '../services/ai/outreachAIService.js';
import { createOutreachForLead } from '../services/outreach/outreachService.js';
import { 
  logStageChange, 
  logOutreachAudit, 
  OutreachAuditAction 
} from '../services/outreach/auditLogger.js';

const router = Router();

router.post("/generate", async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Auth required" });

  const plan = await prisma.outreachPlan.findMany({
    where: { userId, status: "pending" },
    take: 5
  });

  for (const p of plan) {
    await outreachQueue.add("outreach", {
      userId,
      outreachPlanId: p.id,
      dryRun: req.body?.dryRun ?? true
    });
  }

  return res.json({ queued: plan.length });
});

router.post("/prospect", requireAuth, async (req, res) => {
  const { niche, count } = req.body ?? {};
  const leadsResponse = await generateLeadProspects(req.user, niche, count || 20);
  const leads = leadsResponse.data || [];
  const created = await Promise.all(
    leads.map((l: any) =>
      prisma.lead.create({
        data: {
          id: `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          email: l.brandEmail || `lead-${Date.now()}@example.com`,
          brandName: l.brandName,
          brandEmail: l.brandEmail,
          name: l.brandName,
          company: l.brandName,
          status: "new",
          metadata: { score: l.score || 50, industry: l.industry, niche },
          updatedAt: new Date()
        }
      })
    )
  );
  return res.json({ leads: created });
});

router.post("/start/:leadId", requireAuth, async (req, res) => {
  const lead = await prisma.lead.findUnique({ where: { id: req.params.leadId } });
  if (!lead) return res.status(404).json({ error: true, message: "Lead not found" });
  const seq = await createOutreachForLead(lead, req.user);
  return res.json({ sequence: seq });
});

router.patch("/sequence/:seqId/pause", requireAuth, async (req, res) => {
  await prisma.outreachSequence.update({
    where: { id: req.params.seqId },
    data: { status: "paused" }
  });
  return res.json({ ok: true });
});

// GET /api/outreach/records - List all outreach records (Admin only)
router.get("/records", requireAuth, requireAdmin, async (req, res) => {
  try {
    const records = await prisma.outreach.findMany({
      where: { archived: false },
      orderBy: { updatedAt: "desc" },
      include: {
        OutreachNote: {
          orderBy: { createdAt: "desc" },
          take: 5
        },
        OutreachTask: {
          orderBy: { dueDate: "asc" }
        }
      }
    });
    
    // Always return array, never null
    return res.json({ records: records || [] });
  } catch (error) {
    console.error("[OUTREACH_LIST] Error:", error);
    // Return empty array on error for safe handling
    res.json({ records: [], error: "Failed to fetch outreach records" });
  }
});

// POST /api/outreach/records - Create new outreach record (Admin only)
router.post("/records", requireAuth, requireAdmin, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const {
      target, type, contact, contactEmail, link, owner, source, stage,
      status, summary, threadUrl, gmailThreadId, nextFollowUp, reminder
    } = req.body;

    const record = await prisma.outreach.create({
      data: {
        id: `outreach_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        target,
        type: type || "Brand",
        contact,
        contactEmail,
        link,
        owner: owner || req.user?.email,
        source,
        stage: stage || "not-started",
        status: status || "Not started",
        summary,
        threadUrl,
        gmailThreadId,
        nextFollowUp: nextFollowUp ? new Date(nextFollowUp) : null,
        reminder,
        createdBy: userId,
        archived: false,
        updatedAt: new Date()
      }
    });

    // Audit log
    await logOutreachAudit({
      action: OutreachAuditAction.OPPORTUNITY_CREATED,
      entityType: "outreach",
      entityId: record.id,
      userId,
      newState: { target, stage, type }
    });

    res.json({ record });
  } catch (error) {
    console.error("[OUTREACH_CREATE] Error:", error);
    res.status(500).json({ error: "Failed to create outreach record" });
  }
});

// PATCH /api/outreach/records/:id - Update outreach record (Admin only)
router.patch("/records/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const userId = req.user!.id;

    // Get current state for audit log
    const current = await prisma.outreach.findUnique({ where: { id } });
    if (!current) {
      return res.status(404).json({ error: "Outreach record not found" });
    }

    if (updates.nextFollowUp) updates.nextFollowUp = new Date(updates.nextFollowUp);
    if (updates.lastContact) updates.lastContact = new Date(updates.lastContact);

    const record = await prisma.outreach.update({
      where: { id },
      data: updates
    });

    // Audit log stage changes
    if (updates.stage && updates.stage !== current.stage) {
      await logStageChange(id, userId, current.stage, updates.stage);
    }

    res.json({ record });
  } catch (error) {
    console.error("[OUTREACH_UPDATE] Error:", error);
    res.status(500).json({ error: "Failed to update outreach record" });
  }
});

// GET /api/outreach/records/:id - Get single outreach record (Admin only)
router.get("/records/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const record = await prisma.outreach.findUnique({
      where: { id },
      include: {
        OutreachNote: {
          orderBy: { createdAt: "desc" }
        },
        OutreachTask: {
          orderBy: { dueDate: "asc" }
        },
        OutreachEmailThread: {
          orderBy: { lastMessageAt: "desc" }
        },
        SalesOpportunity: true
      }
    });

    if (!record) {
      return res.status(404).json({ error: "Outreach record not found" });
    }

    res.json({ record });
  } catch (error) {
    console.error("[OUTREACH_GET] Error:", error);
    res.status(500).json({ error: "Failed to fetch outreach record" });
  }
});

// DELETE /api/outreach/records/:id - Soft delete (archive) outreach record (Admin only)
router.delete("/records/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const record = await prisma.outreach.update({
      where: { id },
      data: { archived: true }
    });

    // Audit log
    await logOutreachAudit({
      action: OutreachAuditAction.OUTREACH_ARCHIVED,
      entityType: "outreach",
      entityId: id,
      userId,
      previousState: { archived: false },
      newState: { archived: true }
    });

    res.json({ record, message: "Outreach archived successfully" });
  } catch (error) {
    console.error("[OUTREACH_DELETE] Error:", error);
    res.status(500).json({ error: "Failed to archive outreach record" });
  }
});

// GET /api/outreach/records/:id/gmail-thread - Fetch Gmail thread
router.get("/records/:id/gmail-thread", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const record = await prisma.outreach.findUnique({ where: { id } });

    if (!record?.gmailThreadId) {
      return res.json({ messages: [] });
    }

    const messages = await prisma.inboundEmail.findMany({
      where: { threadId: record.gmailThreadId },
      orderBy: { receivedAt: "asc" }
    });

    res.json({ messages });
  } catch (error) {
    console.error("[OUTREACH_GMAIL_THREAD] Error:", error);
    res.status(500).json({ error: "Failed to fetch Gmail thread" });
  }
});

// POST /api/outreach/records/:id/link-gmail-thread - Manually link Gmail thread
router.post("/records/:id/link-gmail-thread", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { gmailThreadId } = req.body;

    if (!gmailThreadId) {
      return res.status(400).json({ error: "gmailThreadId is required" });
    }

    // Update outreach with thread ID
    const outreach = await prisma.outreach.update({
      where: { id },
      data: { gmailThreadId }
    });

    // Check if thread already exists in InboundEmail
    const messages = await prisma.inboundEmail.findMany({
      where: { threadId: gmailThreadId },
      orderBy: { receivedAt: "desc" },
      take: 1
    });

    const lastMessage = messages[0];

    // Create or update OutreachEmailThread
    const threadData = {
      id: `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      outreachId: id,
      gmailThreadId,
      lastMessageAt: lastMessage?.receivedAt || new Date(),
      status: "awaiting_reply",
      lastSyncedAt: new Date(),
      updatedAt: new Date()
    };

    const thread = await prisma.outreachEmailThread.upsert({
      where: { gmailThreadId },
      create: threadData,
      update: {
        lastMessageAt: threadData.lastMessageAt,
        lastSyncedAt: threadData.lastSyncedAt,
        updatedAt: new Date()
      }
    });

    res.json({ 
      outreach, 
      thread,
      messages: messages.length,
      message: "Gmail thread linked successfully" 
    });
  } catch (error) {
    console.error("[OUTREACH_LINK_THREAD] Error:", error);
    res.status(500).json({ error: "Failed to link Gmail thread" });
  }
});

// POST /api/outreach/records/:id/notes - Add note
router.post("/records/:id/notes", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { body } = req.body;

    if (!body?.trim()) {
      return res.status(400).json({ error: "Note body is required" });
    }

    const note = await prisma.outreachNote.create({
      data: {
        id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        outreachId: id,
        author: req.user?.email || "Admin",
        body: body.trim()
      }
    });

    res.json({ note });
  } catch (error) {
    console.error("[OUTREACH_NOTE_CREATE] Error:", error);
    res.status(500).json({ error: "Failed to create note" });
  }
});

// GET /api/outreach/records/:id/notes - Get notes
router.get("/records/:id/notes", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const notes = await prisma.outreachNote.findMany({
      where: { outreachId: id },
      orderBy: { createdAt: "desc" }
    });
    res.json({ notes });
  } catch (error) {
    console.error("[OUTREACH_NOTES_LIST] Error:", error);
    res.status(500).json({ error: "Failed to fetch notes" });
  }
});

// POST /api/outreach/records/:id/tasks - Add task
router.post("/records/:id/tasks", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, dueDate, owner, priority } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ error: "Task title is required" });
    }

    const task = await prisma.outreachTask.create({
      data: {
        id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        outreachId: id,
        title: title.trim(),
        dueDate: dueDate ? new Date(dueDate) : null,
        owner: owner || req.user?.email,
        priority: priority || "Medium",
        status: "Open",
        updatedAt: new Date()
      }
    });

    res.json({ task });
  } catch (error) {
    console.error("[OUTREACH_TASK_CREATE] Error:", error);
    res.status(500).json({ error: "Failed to create task" });
  }
});

// GET /api/outreach/records/:id/tasks - Get tasks
router.get("/records/:id/tasks", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const tasks = await prisma.outreachTask.findMany({
      where: { outreachId: id },
      orderBy: { dueDate: "asc" }
    });
    res.json({ tasks });
  } catch (error) {
    console.error("[OUTREACH_TASKS_LIST] Error:", error);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

// PATCH /api/outreach/tasks/:taskId - Update task
router.patch("/tasks/:taskId", requireAuth, async (req, res) => {
  try {
    const { taskId } = req.params;
    const updates = req.body;
    if (updates.dueDate) updates.dueDate = new Date(updates.dueDate);

    const task = await prisma.outreachTask.update({
      where: { id: taskId },
      data: updates
    });

    res.json({ task });
  } catch (error) {
    console.error("[OUTREACH_TASK_UPDATE] Error:", error);
    res.status(500).json({ error: "Failed to update task" });
  }
});

// GET /api/outreach/reminders - Get upcoming reminders
router.get("/reminders", requireAuth, async (req, res) => {
  try {
    const now = new Date();
    const soon = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const records = await prisma.outreach.findMany({
      where: {
        nextFollowUp: {
          gte: now,
          lte: soon
        }
      },
      orderBy: { nextFollowUp: "asc" }
    });

    res.json({ reminders: records });
  } catch (error) {
    console.error("[OUTREACH_REMINDERS] Error:", error);
    res.status(500).json({ error: "Failed to fetch reminders" });
  }
});

export default router;
