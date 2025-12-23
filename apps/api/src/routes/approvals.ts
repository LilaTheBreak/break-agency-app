import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import prisma from "../lib/prisma.js";

const router = Router();

router.get("/api/approvals", requireAuth, async (req: Request, res: Response) => {
  const userRoles = req.user?.roles?.map(r => r.role.name) || [];
  if (!userRoles.includes("ADMIN") && !userRoles.includes("SUPER_ADMIN")) {
    // Return empty array instead of 403 - graceful degradation
    return res.status(200).json([]);
  }

  try {
    const limit = parseInt(req.query.limit as string) || 4;
    const status = (req.query.status as string)?.toUpperCase() || "PENDING";

    const [contentApprovals, ugcApprovals] = await prisma.$transaction([
      prisma.contentApproval.findMany({
        where: { status },
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.ugcApproval.findMany({
        where: { status },
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const combined = [
      ...contentApprovals.map(a => ({ ...a, type: 'content' })),
      ...ugcApprovals.map(a => ({ ...a, type: 'ugc' })),
    ];

    const sortedApprovals = combined.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, limit);

    res.json(sortedApprovals);
  } catch (error) {
    console.error("[Approvals] Error fetching approvals:", error);
    // Return empty array instead of 500 - graceful degradation
    res.status(200).json([]);
  }
});

const updateApprovalStatus = async (id: string, status: "APPROVED" | "REJECTED") => {
  // This logic assumes approval IDs are unique across both tables.
  // A more robust solution might involve a `type` parameter in the request.
  try {
    // Attempt to update ContentApproval first
    return await prisma.contentApproval.update({ where: { id }, data: { status } });
  } catch (e) {
    // If it fails (e.g., record not found), try UGCApproval
    return prisma.ugcApproval.update({ where: { id }, data: { status } });
  }
};

router.post("/api/approvals/:id/approve", requireAdmin, async (req: Request, res: Response) => {
  try {
    const updated = await updateApprovalStatus(req.params.id, "APPROVED");
    res.json(updated);
  } catch (error) {
    res.status(404).json({ error: "Approval item not found." });
  }
});

router.post("/api/approvals/:id/reject", requireAdmin, async (req: Request, res: Response) => {
  try {
    const updated = await updateApprovalStatus(req.params.id, "REJECTED");
    res.json(updated);
  } catch (error) {
    res.status(404).json({ error: "Approval item not found." });
  }
});


export default router;
