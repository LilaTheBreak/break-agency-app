import { Router } from "express";
import { requireAuth } from "../middleware/auth";
// @ts-ignore - Module resolution issue
import prisma from "../lib/prisma";
// @ts-ignore - Module resolution issue
import { logAdminActivity } from "../lib/adminActivityLogger";
// @ts-ignore - Module resolution issue
import { logError } from "../lib/logger";
// @ts-ignore - Module resolution issue
import { isSuperAdmin } from "../lib/roleHelpers";
import {
  ensureTalentAccess,
  setTalentAccess,
  getTalentAccessList,
} from '../lib/talentAccessControl';
import { blockAdminActionsWhileImpersonating } from '../lib/dataScopingHelpers';

const router = Router();

// Apply authentication middleware to all routes
router.use(requireAuth);

/**
 * GET /api/talent/:talentId/access-list
 * Get all users with explicit access to this talent + list of available users
 * Admin-only endpoint
 */
router.get("/:talentId/access-list", async (req, res) => {
  try {
    const { talentId } = req.params;
    const adminId = req.user?.id;

    // Verify admin
    if (!isSuperAdmin(req)) {
      return res.status(403).json({
        error: "Unauthorized",
        message: "Admin access required",
      });
    }

    // Verify talent exists
    const talent = await prisma.talent.findUnique({
      where: { id: talentId },
      select: { id: true, userId: true, managerId: true },
    });

    if (!talent) {
      return res.status(404).json({
        error: "Not Found",
        message: "Talent not found",
      });
    }

    // Get explicit access list
    const accessList = await prisma.talentUserAccess.findMany({
      where: { talentId },
      include: {
        User: {
          select: { id: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Get all users in system
    const allUsers = await prisma.user.findMany({
      select: { id: true, email: true, role: true },
      orderBy: { email: "asc" },
    });

    // Format response
    const users = accessList.map((access) => ({
      id: access.User.id,
      email: access.User.email,
      role: access.role as "VIEW" | "MANAGE",
      canRemove: true,
      reason: undefined,
    }));

    // Add defaults (owner, manager) if not already in list
    const userIds = new Set(users.map((u) => u.id));

    if (talent.userId && !userIds.has(talent.userId)) {
      const owner = allUsers.find((u) => u.id === talent.userId);
      if (owner) {
        users.unshift({
          id: owner.id,
          email: owner.email,
          role: "MANAGE" as const,
          canRemove: false,
          reason: undefined,
        });
        userIds.add(owner.id);
      }
    }

    if (talent.managerId && !userIds.has(talent.managerId)) {
      const manager = allUsers.find((u) => u.id === talent.managerId);
      if (manager) {
        users.push({
          id: manager.id,
          email: manager.email,
          role: "MANAGE" as const,
          canRemove: false,
          reason: undefined,
        });
        userIds.add(manager.id);
      }
    }

    // Available users = all except those already with access
    const available = allUsers
      .filter((u) => !userIds.has(u.id))
      .map((u) => ({
        id: u.id,
        email: u.email,
        role: undefined,
        canRemove: false,
        reason: undefined,
      }));

    return res.json({
      users,
      available,
    });
  } catch (err) {
    logError("[talent-access] GET access-list", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to fetch access list",
    });
  }
});

/**
 * POST /api/talent/:talentId/access-set
 * Grant or update access for a user to this talent
 * Admin-only endpoint
 *
 * Body:
 * {
 *   userId: string,
 *   role: "VIEW" | "MANAGE"
 * }
 */
router.post("/:talentId/access-set", async (req, res) => {
  try {
    // Block admin actions while impersonating
    blockAdminActionsWhileImpersonating(req);
    
    const { talentId } = req.params;
    const { userId, role } = req.body;

    // Verify admin
    if (!isSuperAdmin(req)) {
      return res.status(403).json({
        error: "Unauthorized",
        message: "Admin access required",
      });
    }

    // Validate input
    if (!userId || !["VIEW", "MANAGE"].includes(role)) {
      return res.status(400).json({
        error: "Bad Request",
        message: "userId and role (VIEW|MANAGE) required",
      });
    }

    // Verify talent exists
    const talent = await prisma.talent.findUnique({
      where: { id: talentId },
      select: { id: true, name: true },
    });

    if (!talent) {
      return res.status(404).json({
        error: "Not Found",
        message: "Talent not found",
      });
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });

    if (!user) {
      return res.status(404).json({
        error: "Not Found",
        message: "User not found",
      });
    }

    // Set access
    await setTalentAccess(talentId, userId, role);

    // Audit log
    if (req.user) {
      await logAdminActivity(req as any, {
        event: "TALENT_ACCESS_GRANTED",
        metadata: {
          talentId,
          userId,
          role,
          talentName: talent.name,
          userEmail: user.email,
        },
      });
    }

    return res.json({
      success: true,
      message: `${role} access granted to ${user.email}`,
    });
  } catch (err) {
    logError("[talent-access] POST access-set", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to grant access",
    });
  }
});

/**
 * POST /api/talent/:talentId/access-revoke
 * Revoke access for a user from this talent
 * Admin-only endpoint
 *
 * Body:
 * {
 *   userId: string
 * }
 */
router.post("/:talentId/access-revoke", async (req, res) => {
  try {
    // Block admin actions while impersonating
    blockAdminActionsWhileImpersonating(req);
    
    const { talentId } = req.params;
    const { userId } = req.body;
    const adminId = req.user?.id;

    // Verify admin
    if (!isSuperAdmin(req)) {
      return res.status(403).json({
        error: "Unauthorized",
        message: "Admin access required",
      });
    }

    // Validate input
    if (!userId) {
      return res.status(400).json({
        error: "Bad Request",
        message: "userId required",
      });
    }

    // Verify talent exists
    const talent = await prisma.talent.findUnique({
      where: { id: talentId },
      select: { id: true, userId: true, managerId: true, name: true },
    });

    if (!talent) {
      return res.status(404).json({
        error: "Not Found",
        message: "Talent not found",
      });
    }

    // Prevent revoking access from owner or manager
    if (userId === talent.userId || userId === talent.managerId) {
      return res.status(400).json({
        error: "Bad Request",
        message:
          "Cannot revoke access from owner or assigned manager. Update talent assignment first.",
      });
    }

    // Get user info for audit log
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });

    // Delete access record
    await prisma.talentUserAccess.deleteMany({
      where: {
        talentId,
        userId,
      },
    });

    // Audit log
    if (adminId) {
      await logAdminActivity(req as any, {
        event: "TALENT_ACCESS_REVOKED",
        metadata: {
          talentId,
          userId,
          talentName: talent.name,
          userEmail: user?.email,
        },
      });
    }

    return res.json({
      success: true,
      message: `Access revoked from ${user?.email}`,
    });
  } catch (err) {
    logError("[talent-access] POST access-revoke", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to revoke access",
    });
  }
});

export default router;
