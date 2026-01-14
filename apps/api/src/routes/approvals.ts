import { Router, type Request, type Response } from "express";
import { requireAuth } from '../middleware/auth';
import { requireAdmin } from '../middleware/requireAdmin';
import prisma from '../lib/prisma';

const router = Router();

// Helper: Log approval actions to audit log
async function logApprovalAction(
  userId: string,
  action: string,
  approvalId: string,
  metadata?: any
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entityType: "APPROVAL",
        entityId: approvalId,
        metadata: metadata || {},
        createdAt: new Date(),
      },
    });
  } catch (error) {
    console.error("[Audit] Failed to log approval action:", error);
  }
}

// GET /api/approvals - List approvals with filters
router.get("/api/approvals", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const status = req.query.status as string;
    const type = req.query.type as string;
    const search = req.query.search as string;

    const where: any = {};
    if (status) where.status = status.toUpperCase();
    if (type) where.type = type;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const approvals = await prisma.approval.findMany({
      where,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        Requestor: {
          select: { id: true, name: true, email: true },
        },
        Approver: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return res.json(approvals);
  } catch (error) {
    console.error("[Approvals] Error fetching approvals:", error);
    return res.status(500).json({ error: "Failed to fetch approvals" });
  }
});

// POST /api/approvals - Create approval
router.post("/api/approvals", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { type, title, description, ownerId, attachments, metadata } = req.body;

    if (!type || !title) {
      return res.status(400).json({ error: "Type and title are required" });
    }

    const approval = await prisma.approval.create({
      data: {
        type,
        title,
        description,
        requestorId: req.user!.id,
        ownerId,
        attachments: attachments || [],
        metadata: metadata || {},
        status: "PENDING",
      },
      include: {
        Requestor: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    await logApprovalAction(req.user!.id, "APPROVAL_CREATED", approval.id, {
      type: approval.type,
      title: approval.title,
    });

    return res.status(201).json(approval);
  } catch (error) {
    console.error("[Approvals] Error creating approval:", error);
    return res.status(500).json({ error: "Failed to create approval" });
  }
});

// PATCH /api/approvals/:id - Update approval
router.patch("/api/approvals/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { type, title, description, ownerId, attachments, metadata } = req.body;

    const existing = await prisma.approval.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Approval not found" });
    }

    const updateData: any = {};
    if (type !== undefined) updateData.type = type;
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (ownerId !== undefined) updateData.ownerId = ownerId;
    if (attachments !== undefined) updateData.attachments = attachments;
    if (metadata !== undefined) updateData.metadata = metadata;

    const updated = await prisma.approval.update({
      where: { id },
      data: updateData,
      include: {
        Requestor: {
          select: { id: true, name: true, email: true },
        },
        Approver: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    await logApprovalAction(req.user!.id, "APPROVAL_UPDATED", id, {
      changes: updateData,
    });

    return res.json(updated);
  } catch (error) {
    console.error("[Approvals] Error updating approval:", error);
    return res.status(500).json({ error: "Failed to update approval" });
  }
});

// DELETE /api/approvals/:id - Delete approval
router.delete("/api/approvals/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.approval.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Approval not found" });
    }

    await prisma.approval.delete({ where: { id } });

    await logApprovalAction(req.user!.id, "APPROVAL_DELETED", id, {
      type: existing.type,
      title: existing.title,
    });

    return res.json({ success: true, message: "Approval deleted" });
  } catch (error) {
    console.error("[Approvals] Error deleting approval:", error);
    return res.status(500).json({ error: "Failed to delete approval" });
  }
});

// POST /api/approvals/:id/approve - Approve
router.post("/api/approvals/:id/approve", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.approval.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Approval not found" });
    }

    const updated = await prisma.approval.update({
      where: { id },
      data: {
        status: "APPROVED",
        approverId: req.user!.id,
      },
      include: {
        Requestor: {
          select: { id: true, name: true, email: true },
        },
        Approver: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    await logApprovalAction(req.user!.id, "APPROVAL_APPROVED", id, {
      type: updated.type,
      title: updated.title,
      previousStatus: existing.status,
      newStatus: "APPROVED",
    });

    return res.json(updated);
  } catch (error) {
    console.error("[Approvals] Error approving:", error);
    return res.status(500).json({ error: "Failed to approve" });
  }
});

// POST /api/approvals/:id/reject - Reject
router.post("/api/approvals/:id/reject", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.approval.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Approval not found" });
    }

    const updated = await prisma.approval.update({
      where: { id },
      data: {
        status: "REJECTED",
        approverId: req.user!.id,
      },
      include: {
        Requestor: {
          select: { id: true, name: true, email: true },
        },
        Approver: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    await logApprovalAction(req.user!.id, "APPROVAL_REJECTED", id, {
      type: updated.type,
      title: updated.title,
      previousStatus: existing.status,
      newStatus: "REJECTED",
    });

    return res.json(updated);
  } catch (error) {
    console.error("[Approvals] Error rejecting:", error);
    return res.status(500).json({ error: "Failed to reject" });
  }
});

export default router;
