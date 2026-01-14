/**
 * Talent Access Control Service
 *
 * Provides role-based access control for talent-related operations.
 * Enforced server-side on all talent endpoints.
 *
 * Access Levels:
 * - NONE: No access (return 403)
 * - VIEW: Can view talent and deals (read-only)
 * - MANAGE: Can edit talent, deals, contracts, etc.
 *
 * Rules:
 * - Superadmins always have MANAGE access
 * - Talent owner always has MANAGE access
 * - Talent manager always has MANAGE access
 * - Explicit access via TalentUserAccess
 */

import { Request } from "express";
import prisma from './prisma';
import { isSuperAdmin, isAdmin } from './roleHelpers';
import { logError } from './logger';

export type AccessLevel = "NONE" | "VIEW" | "MANAGE";

/**
 * Determine if a user can view a talent
 */
export async function canViewTalent(
  userId: string,
  talentId: string
): Promise<boolean> {
  try {
    const level = await getTalentAccessLevel(userId, talentId);
    return level !== "NONE";
  } catch (error) {
    logError("canViewTalent error", error, { userId, talentId });
    return false;
  }
}

/**
 * Determine if a user can manage (edit) a talent
 */
export async function canManageTalent(
  userId: string,
  talentId: string
): Promise<boolean> {
  try {
    const level = await getTalentAccessLevel(userId, talentId);
    return level === "MANAGE";
  } catch (error) {
    logError("canManageTalent error", error, { userId, talentId });
    return false;
  }
}

/**
 * Get the access level for a user on a specific talent
 * Returns: NONE | VIEW | MANAGE
 */
export async function getTalentAccessLevel(
  userId: string,
  talentId: string
): Promise<AccessLevel> {
  try {
    // Fetch talent with user role info
    const talent = await prisma.talent.findUnique({
      where: { id: talentId },
      select: {
        id: true,
        userId: true, // Talent owner (creator)
        managerId: true, // Manager assigned
      },
    });

    if (!talent) {
      // Talent not found - no access
      return "NONE";
    }

    // Get the requesting user's role via User model
    // This is a workaround since req.user is not available here
    // We'll need to pass user role explicitly or fetch it
    // For now, return the access based on talent relations
    // The caller (request handler) should check isSuperAdmin/isAdmin separately

    // Rule 1: Talent owner (creator) has MANAGE access
    if (talent.userId === userId) {
      return "MANAGE";
    }

    // Rule 2: Assigned manager has MANAGE access
    if (talent.managerId === userId) {
      return "MANAGE";
    }

    // Rule 3: Check explicit access via TalentUserAccess
    const access = await prisma.talentUserAccess.findUnique({
      where: {
        talentId_userId: {
          talentId,
          userId,
        },
      },
      select: {
        role: true,
      },
    });

    if (access && access.role) {
      return access.role === "MANAGE" ? "MANAGE" : "VIEW";
    }

    // No access found
    return "NONE";
  } catch (error) {
    logError("getTalentAccessLevel error", error, { userId, talentId });
    return "NONE";
  }
}

/**
 * Middleware to ensure talent access
 * Pass as express middleware: ensureTalentAccess(req, talentId, 'VIEW')
 *
 * Returns 403 if access denied
 */
export async function ensureTalentAccess(
  req: Request,
  talentId: string,
  requiredLevel: "VIEW" | "MANAGE"
): Promise<void> {
  const userId = (req as any).user?.id;
  if (!userId) {
    throw new Error("User not authenticated");
  }

  // Superadmins always have full access
  if (isSuperAdmin(req as any)) {
    return;
  }

  // Admins can have MANAGE access (depends on their team setup)
  // For now, admins get full access to all talent
  if (isAdmin(req as any)) {
    return;
  }

  // Get the user's access level
  const level = await getTalentAccessLevel(userId, talentId);

  // Check if access level meets requirement
  if (level === "NONE") {
    const error = new Error("Access denied");
    (error as any).status = 403;
    throw error;
  }

  if (requiredLevel === "MANAGE" && level !== "MANAGE") {
    const error = new Error("Manage permission required");
    (error as any).status = 403;
    throw error;
  }
}

/**
 * Set talent access for a user
 *
 * Pass role as 'VIEW', 'MANAGE', or 'NONE' to remove access
 */
export async function setTalentAccess(
  talentId: string,
  userId: string,
  role: "VIEW" | "MANAGE" | "NONE"
): Promise<void> {
  try {
    if (role === "NONE") {
      // Remove access
      await prisma.talentUserAccess.deleteMany({
        where: {
          talentId,
          userId,
        },
      });
    } else {
      // Create or update access
      await prisma.talentUserAccess.upsert({
        where: {
          talentId_userId: {
            talentId,
            userId,
          },
        },
        create: {
          talentId,
          userId,
          role,
        },
        update: {
          role,
        },
      });
    }
  } catch (error) {
    logError("setTalentAccess error", error, { talentId, userId, role });
    throw error;
  }
}

/**
 * Get all users with access to a talent
 */
export async function getTalentAccessList(talentId: string) {
  try {
    const access = await prisma.talentUserAccess.findMany({
      where: { talentId },
      select: {
        userId: true,
        role: true,
        User: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return access.map((item) => ({
      userId: item.userId,
      role: item.role,
      user: item.User,
    }));
  } catch (error) {
    logError("getTalentAccessList error", error, { talentId });
    throw error;
  }
}

/**
 * Get all talents a user has access to
 */
export async function getUserTalentAccess(userId: string) {
  try {
    const access = await prisma.talentUserAccess.findMany({
      where: { userId },
      select: {
        talentId: true,
        role: true,
        Talent: {
          select: {
            id: true,
            name: true,
            displayName: true,
            representationType: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return access.map((item) => ({
      talentId: item.talentId,
      role: item.role,
      talent: item.Talent,
    }));
  } catch (error) {
    logError("getUserTalentAccess error", error, { userId });
    throw error;
  }
}

/**
 * Initialize access for a new talent
 * Called when talent is created
 */
export async function initializeTalentAccess(
  talentId: string,
  creatorUserId: string,
  managerUserId?: string
): Promise<void> {
  try {
    // Give creator MANAGE access
    await setTalentAccess(talentId, creatorUserId, "MANAGE");

    // Give manager MANAGE access if assigned
    if (managerUserId) {
      await setTalentAccess(talentId, managerUserId, "MANAGE");
    }

    // Give all superadmins MANAGE access
    const superadmins = await prisma.user.findMany({
      where: { role: "SUPERADMIN" },
      select: { id: true },
    });

    for (const admin of superadmins) {
      await setTalentAccess(talentId, admin.id, "MANAGE");
    }
  } catch (error) {
    logError("initializeTalentAccess error", error, {
      talentId,
      creatorUserId,
      managerUserId,
    });
    throw error;
  }
}
