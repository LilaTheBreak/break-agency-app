import { Router } from "express";
import prisma from "../lib/prisma.js";
import { requireRole } from "../middleware/requireRole.js";

const router = Router();

router.use(requireRole(["admin", "ADMIN"]));

router.delete("/users/:email", async (req, res) => {
  const email = (req.params.email || "").toLowerCase();
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }
  try {
    await prisma.user.delete({ where: { email } });
    res.json({ success: true });
  } catch (error) {
    console.error("Delete user failed", error);
    res.status(404).json({ error: "User not found" });
  }
});

router.post("/users", async (req, res) => {
  const email = (req.body?.email || "").toLowerCase();
  const roleNameRaw = req.body?.role;
  if (!email || !roleNameRaw) {
    return res.status(400).json({ error: "email and role are required" });
  }
  const normalizedRole = String(roleNameRaw).toUpperCase();
  try {
    const role = await prisma.role.upsert({
      where: { name: normalizedRole },
      update: {},
      create: { name: normalizedRole }
    });
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email }
    });
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: role.id } },
      update: {},
      create: { userId: user.id, roleId: role.id }
    });
    res.status(201).json({ user: { email: user.email, role: role.name } });
  } catch (error) {
    console.error("Create user failed", error);
    res.status(500).json({ error: "Unable to create user" });
  }
});

/**
 * GET /api/admin/users/pending
 * Get all users pending approval
 */
router.get("/users/pending", async (req, res) => {
  try {
    console.log("[ADMIN USERS PENDING] Fetching pending users...");
    const pendingUsers = await prisma.user.findMany({
      where: {
        onboarding_status: "pending_review"
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        onboarding_responses: true,
        admin_notes: true
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    console.log("[ADMIN USERS PENDING] Found", pendingUsers.length, "pending users");
    res.json({ users: pendingUsers });
  } catch (error) {
    console.error("[ADMIN USERS PENDING] Error:", error);
    res.status(500).json({ error: "Failed to fetch pending users" });
  }
});

/**
 * POST /api/admin/users/:id/approve
 * Approve a user
 */
router.post("/users/:id/approve", async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: {
        onboarding_status: "approved",
        admin_notes: notes || null,
        updatedAt: new Date()
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        onboarding_status: true
      }
    });

    // TODO: Send approval email notification

    res.json({
      success: true,
      message: "User approved successfully",
      user
    });
  } catch (error) {
    console.error("[ADMIN USER APPROVE]", error);
    res.status(500).json({ error: "Failed to approve user" });
  }
});

/**
 * POST /api/admin/users/:id/reject
 * Reject a user
 */
router.post("/users/:id/reject", async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: {
        onboarding_status: "rejected",
        admin_notes: reason || "Application rejected",
        updatedAt: new Date()
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        onboarding_status: true
      }
    });

    // TODO: Send rejection email notification

    res.json({
      success: true,
      message: "User rejected",
      user
    });
  } catch (error) {
    console.error("[ADMIN USER REJECT]", error);
    res.status(500).json({ error: "Failed to reject user" });
  }
});

/**
 * GET /api/admin/users
 * Get all users with filtering
 */
router.get("/users", async (req, res) => {
  try {
    const { status, role, search } = req.query;

    const where: any = {};

    if (status) {
      where.onboarding_status = status;
    }

    if (role) {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: "insensitive" } },
        { email: { contains: search as string, mode: "insensitive" } }
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        onboarding_status: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 100 // Pagination TODO
    });

    res.json({ users });
  } catch (error) {
    console.error("[ADMIN USERS LIST]", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

/**
 * PATCH /api/admin/users/:id
 * Update user details (role, status, notes)
 */
router.patch("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { role, onboarding_status, admin_notes } = req.body;

    const updateData: any = { updatedAt: new Date() };

    if (role) updateData.role = role;
    if (onboarding_status) updateData.onboarding_status = onboarding_status;
    if (admin_notes !== undefined) updateData.admin_notes = admin_notes;

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        onboarding_status: true,
        admin_notes: true
      }
    });

    res.json({ success: true, user });
  } catch (error) {
    console.error("[ADMIN USER UPDATE]", error);
    res.status(500).json({ error: "Failed to update user" });
  }
});

export default router;
