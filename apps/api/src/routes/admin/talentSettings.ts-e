import { Router, Request, Response } from "express";
import prisma from '../../lib/prisma';
import { logError } from '../../lib/logger';
import { isAdmin, isSuperAdmin } from '../../lib/roleHelpers';

const router = Router({ mergeParams: true });

/**
 * GET /api/admin/talent/:id/settings
 * 
 * Fetch talent settings including:
 * - Currency
 * - Assigned managers
 * 
 * Access: ADMIN, SUPERADMIN only
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    // Check permissions
    if (!isAdmin(user) && !isSuperAdmin(user)) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Fetch talent
    const talent = await prisma.talent.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        currency: true,
        ManagerAssignments: {
          include: {
            manager: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
                role: true,
              },
            },
          },
        },
      },
    });

    if (!talent) {
      return res.status(404).json({ error: "Talent not found" });
    }

    // Format response
    const managers = talent.ManagerAssignments.map((assignment) => ({
      managerId: assignment.managerId,
      role: assignment.role,
      manager: {
        id: assignment.manager.id,
        name: assignment.manager.name,
        email: assignment.manager.email,
        avatarUrl: assignment.manager.avatarUrl,
        role: assignment.manager.role,
      },
    }));

    return res.json({
      talentId: talent.id,
      talentName: talent.name,
      currency: talent.currency,
      managers,
    });
  } catch (error) {
    logError("Failed to fetch talent settings", error, {
      talentId: req.params.id,
      userId: (req as any).user?.id,
    });
    return res.status(500).json({ error: "Failed to fetch talent settings" });
  }
});

/**
 * POST /api/admin/talent/:id/settings
 * 
 * Update talent settings:
 * - Currency
 * - Manager assignments
 * 
 * Payload:
 * {
 *   currency: "GBP",
 *   managers: [
 *     { managerId, role: "PRIMARY"|"SECONDARY" }
 *   ]
 * }
 * 
 * Access: ADMIN, SUPERADMIN only
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { currency, managers } = req.body;
    const user = (req as any).user;
    const userId = user?.id;

    // Check permissions
    if (!isAdmin(user) && !isSuperAdmin(user)) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Validate talent exists
    const talent = await prisma.talent.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!talent) {
      return res.status(404).json({ error: "Talent not found" });
    }

    // Validate currency if provided
    if (currency) {
      const validCurrencies = ["GBP", "USD", "EUR", "AED", "CAD", "AUD", "JPY"];
      if (!validCurrencies.includes(currency)) {
        return res.status(400).json({ error: "Invalid currency code" });
      }
    }

    // Update talent currency
    if (currency) {
      await prisma.talent.update({
        where: { id },
        data: { currency },
      });
    }

    // Update manager assignments if provided
    if (managers && Array.isArray(managers)) {
      // Validate all managers exist
      const managerIds = managers.map((m) => m.managerId);
      const existingManagers = await prisma.user.findMany({
        where: { id: { in: managerIds } },
        select: { id: true },
      });

      if (existingManagers.length !== managerIds.length) {
        return res.status(400).json({ error: "One or more managers not found" });
      }

      // Delete existing assignments
      await prisma.talentManagerAssignment.deleteMany({
        where: { talentId: id },
      });

      // Create new assignments
      const assignments = await Promise.all(
        managers.map((m) =>
          prisma.talentManagerAssignment.create({
            data: {
              talentId: id,
              managerId: m.managerId,
              role: m.role || "SECONDARY",
            },
          })
        )
      );

      console.log(`[TALENT_SETTINGS] Updated managers for talent ${id}:`, {
        count: assignments.length,
        managerId: userId,
      });
    }

    // Fetch updated settings
    const updated = await prisma.talent.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        currency: true,
        ManagerAssignments: {
          include: {
            manager: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
                role: true,
              },
            },
          },
        },
      },
    });

    const managersList = updated?.ManagerAssignments.map((assignment) => ({
      managerId: assignment.managerId,
      role: assignment.role,
      manager: {
        id: assignment.manager.id,
        name: assignment.manager.name,
        email: assignment.manager.email,
        avatarUrl: assignment.manager.avatarUrl,
        role: assignment.manager.role,
      },
    }));

    return res.json({
      success: true,
      talentId: id,
      talentName: updated?.name,
      currency: updated?.currency,
      managers: managersList,
    });
  } catch (error) {
    logError("Failed to update talent settings", error, {
      talentId: req.params.id,
      userId: (req as any).user?.id,
    });
    return res.status(500).json({ error: "Failed to update talent settings" });
  }
});

/**
 * GET /api/admin/talent/:id/settings/available-managers
 * 
 * Fetch list of available managers (users with ADMIN or MANAGER role)
 * 
 * Access: ADMIN, SUPERADMIN only
 */
router.get("/available-managers", async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    // Check permissions
    if (!isAdmin(user) && !isSuperAdmin(user)) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const managers = await prisma.user.findMany({
      where: {
        role: { in: ["ADMIN", "SUPERADMIN", "MANAGER"] },
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        role: true,
      },
      orderBy: { name: "asc" },
    });

    return res.json({
      managers,
      count: managers.length,
    });
  } catch (error) {
    logError("Failed to fetch available managers", error, {
      userId: (req as any).user?.id,
    });
    return res.status(500).json({ error: "Failed to fetch available managers" });
  }
});

export default router;
