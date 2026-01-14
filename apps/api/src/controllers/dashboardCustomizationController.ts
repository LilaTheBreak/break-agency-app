/**
 * Dashboard Customization Controller
 *
 * API endpoints for:
 * - Getting user's dashboard configuration
 * - Updating dashboard customizations
 * - Fetching snapshot data
 * - Resetting to defaults
 */

import { Request, Response } from "express";
import { z } from "zod";
import { requireAuth } from '../middleware/auth';
import { logError } from '../lib/logger';
import {
  getDashboardConfig,
  updateDashboardConfig,
  resetDashboardToDefault,
  reorderSnapshots,
  toggleSnapshot,
  getEnabledSnapshots,
  SnapshotConfig,
} from '../services/dashboardConfigService';
import {
  getSnapshotsForRole,
  DashboardType,
  RoleType,
} from '../services/snapshotRegistry';
import {
  resolveSnapshotsData,
} from '../services/snapshotResolver';

/**
 * GET /api/dashboard/config
 * Get user's dashboard configuration
 */
export async function getDashboardConfigHandler(
  req: Request & { userId?: string; userRole?: RoleType },
  res: Response
) {
  try {
    const userId = req.userId;
    const userRole = req.userRole;
    const { dashboardType } = req.query;

    if (!userId || !userRole) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!dashboardType || typeof dashboardType !== "string") {
      return res.status(400).json({ error: "dashboardType is required" });
    }

    // Validate dashboard type
    if (!["ADMIN_OVERVIEW", "TALENT_OVERVIEW", "EXCLUSIVE_TALENT_OVERVIEW"].includes(dashboardType)) {
      return res.status(400).json({ error: "Invalid dashboardType" });
    }

    const config = await getDashboardConfig(
      userId,
      dashboardType as DashboardType,
      userRole
    );

    return res.json(config);
  } catch (error) {
    logError("Error fetching dashboard config", { error });
    return res.status(500).json({ error: "Failed to fetch dashboard config" });
  }
}

/**
 * GET /api/dashboard/snapshots
 * Get snapshot data for enabled snapshots in a dashboard
 */
export async function getSnapshotsDataHandler(
  req: Request & { userId?: string; userRole?: RoleType },
  res: Response
) {
  try {
    const userId = req.userId;
    const userRole = req.userRole;
    const { dashboardType } = req.query;

    if (!userId || !userRole) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!dashboardType || typeof dashboardType !== "string") {
      return res.status(400).json({ error: "dashboardType is required" });
    }

    // Get user's config
    const config = await getDashboardConfig(
      userId,
      dashboardType as DashboardType,
      userRole
    );

    // Get enabled snapshots
    const enabledSnapshots = getEnabledSnapshots(config);

    // Fetch data for all enabled snapshots in parallel
    const snapshotDefinitions = enabledSnapshots.map((s) => s.snapshot);
    const snapshotData = await resolveSnapshotsData(snapshotDefinitions, userId);

    return res.json(snapshotData);
  } catch (error) {
    logError("Error fetching snapshots data", { error });
    return res.status(500).json({ error: "Failed to fetch snapshots data" });
  }
}

/**
 * POST /api/dashboard/config
 * Update dashboard configuration
 */
export async function updateDashboardConfigHandler(
  req: Request & { userId?: string; userRole?: RoleType },
  res: Response
) {
  try {
    const userId = req.userId;
    const userRole = req.userRole;
    const { dashboardType, snapshots, customizations } = req.body;

    if (!userId || !userRole) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Validate input
    const updateSchema = z.object({
      dashboardType: z.enum(["ADMIN_OVERVIEW", "TALENT_OVERVIEW", "EXCLUSIVE_TALENT_OVERVIEW"]),
      snapshots: z.array(
        z.object({
          snapshotId: z.string(),
          enabled: z.boolean(),
          order: z.number(),
        })
      ),
      customizations: z.record(z.string(), z.any()).optional(),
    });

    const validation = updateSchema.safeParse({
      dashboardType,
      snapshots,
      customizations,
    });

    if (!validation.success) {
      return res.status(400).json({
        error: "Invalid request",
        details: validation.error.issues || [],
      });
    }

    // Update config
    const updated = await updateDashboardConfig(
      userId,
      dashboardType,
      userRole,
      snapshots,
      customizations
    );

    return res.json(updated);
  } catch (error) {
    if (error instanceof Error) {
      logError("Error updating dashboard config", { error: error.message });
      return res.status(400).json({ error: error.message });
    }

    logError("Error updating dashboard config", { error });
    return res.status(500).json({ error: "Failed to update dashboard config" });
  }
}

/**
 * POST /api/dashboard/config/reset
 * Reset dashboard to default configuration
 */
export async function resetDashboardHandler(
  req: Request & { userId?: string; userRole?: RoleType },
  res: Response
) {
  try {
    const userId = req.userId;
    const userRole = req.userRole;
    const { dashboardType } = req.body;

    if (!userId || !userRole) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!dashboardType || typeof dashboardType !== "string") {
      return res.status(400).json({ error: "dashboardType is required" });
    }

    const reset = await resetDashboardToDefault(
      userId,
      dashboardType as DashboardType,
      userRole
    );

    return res.json(reset);
  } catch (error) {
    logError("Error resetting dashboard config", { error });
    return res.status(500).json({ error: "Failed to reset dashboard config" });
  }
}

/**
 * POST /api/dashboard/config/reorder
 * Reorder snapshots
 */
export async function reorderSnapshotsHandler(
  req: Request & { userId?: string; userRole?: RoleType },
  res: Response
) {
  try {
    const userId = req.userId;
    const userRole = req.userRole;
    const { dashboardType, fromIndex, toIndex } = req.body;

    if (!userId || !userRole) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Get current config
    const config = await getDashboardConfig(
      userId,
      dashboardType as DashboardType,
      userRole
    );

    // Reorder
    const reordered = reorderSnapshots(config.snapshots, fromIndex, toIndex);

    // Save
    const updated = await updateDashboardConfig(
      userId,
      dashboardType as DashboardType,
      userRole,
      reordered,
      config.customizations
    );

    return res.json(updated);
  } catch (error) {
    logError("Error reordering snapshots", { error });
    return res.status(500).json({ error: "Failed to reorder snapshots" });
  }
}

/**
 * POST /api/dashboard/config/toggle
 * Toggle a snapshot on/off
 */
export async function toggleSnapshotHandler(
  req: Request & { userId?: string; userRole?: RoleType },
  res: Response
) {
  try {
    const userId = req.userId;
    const userRole = req.userRole;
    const { dashboardType, snapshotId } = req.body;

    if (!userId || !userRole) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Get current config
    const config = await getDashboardConfig(
      userId,
      dashboardType as DashboardType,
      userRole
    );

    // Toggle
    const toggled = toggleSnapshot(config.snapshots, snapshotId);

    // Save
    const updated = await updateDashboardConfig(
      userId,
      dashboardType as DashboardType,
      userRole,
      toggled,
      config.customizations
    );

    return res.json(updated);
  } catch (error) {
    logError("Error toggling snapshot", { error });
    return res.status(500).json({ error: "Failed to toggle snapshot" });
  }
}

/**
 * GET /api/dashboard/snapshots/available
 * Get all available snapshots for a dashboard
 */
export async function getAvailableSnapshotsHandler(
  req: Request & { userId?: string; userRole?: RoleType },
  res: Response
) {
  try {
    const userRole = req.userRole;
    const { dashboardType } = req.query;

    if (!userRole) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!dashboardType || typeof dashboardType !== "string") {
      return res.status(400).json({ error: "dashboardType is required" });
    }

    const snapshots = getSnapshotsForRole(userRole, dashboardType as DashboardType);

    return res.json(snapshots);
  } catch (error) {
    logError("Error fetching available snapshots", { error });
    return res.status(500).json({ error: "Failed to fetch available snapshots" });
  }
}
