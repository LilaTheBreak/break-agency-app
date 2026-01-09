/**
 * Dashboard Config Service
 *
 * Manages user dashboard customization preferences:
 * - Load/save dashboard configs
 * - Apply defaults for new users
 * - Validate snapshot configurations
 * - Handle role-based defaults
 */

import prisma from "../lib/prisma.js";
import {
  DashboardType,
  RoleType,
  SnapshotDefinition,
  getDefaultConfig,
  getSnapshot,
  getSnapshotsForRole,
  validateSnapshot,
} from "./snapshotRegistry.js";
import { logError } from "../lib/logger.js";

const prismaClient = prisma as any;

export interface SnapshotConfig {
  snapshotId: string;
  enabled: boolean;
  order: number;
}

export interface DashboardConfig {
  userId: string;
  dashboardType: DashboardType;
  snapshots: SnapshotConfig[];
  customizations?: Record<string, any>;
}

/**
 * Get user's dashboard configuration
 * Returns user config if exists, otherwise creates and returns default
 */
export async function getDashboardConfig(
  userId: string,
  dashboardType: DashboardType,
  userRole: RoleType
): Promise<DashboardConfig> {
  try {
    // Try to find existing config
    const existing = await prismaClient.userDashboardConfig.findUnique({
      where: {
        userId_dashboardType: {
          userId,
          dashboardType,
        },
      },
    });

    if (existing) {
      return {
        userId,
        dashboardType,
        snapshots: existing.snapshots as SnapshotConfig[],
        customizations: existing.customizations || undefined,
      };
    }

    // Create default config
    return createDefaultConfig(userId, dashboardType, userRole);
  } catch (error) {
    logError("Error fetching dashboard config", {
      userId,
      dashboardType,
      error,
    });

    // Return in-memory default on error
    const defaultSnapshots = getDefaultConfig(userRole, dashboardType);
    return {
      userId,
      dashboardType,
      snapshots: defaultSnapshots,
    };
  }
}

/**
 * Create and save default configuration for a user
 */
export async function createDefaultConfig(
  userId: string,
  dashboardType: DashboardType,
  userRole: RoleType
): Promise<DashboardConfig> {
  const snapshots = getDefaultConfig(userRole, dashboardType);

  try {
    // Save to database
    await prismaClient.userDashboardConfig.create({
      data: {
        userId,
        dashboardType,
        snapshots,
      },
    });
  } catch (error) {
    logError("Error creating default dashboard config", {
      userId,
      dashboardType,
      error,
    });
    // Continue with in-memory config
  }

  return {
    userId,
    dashboardType,
    snapshots,
  };
}

/**
 * Update dashboard configuration
 * Validates all snapshot IDs against role/dashboard type
 */
export async function updateDashboardConfig(
  userId: string,
  dashboardType: DashboardType,
  userRole: RoleType,
  snapshots: SnapshotConfig[],
  customizations?: Record<string, any>
): Promise<DashboardConfig> {
  // Validate snapshots
  for (const snapshot of snapshots) {
    if (!validateSnapshot(snapshot.snapshotId, userRole, dashboardType)) {
      throw new Error(
        `Snapshot ${snapshot.snapshotId} not allowed for role ${userRole} on dashboard ${dashboardType}`
      );
    }
  }

  try {
    // Upsert config
    const updated = await prismaClient.userDashboardConfig.upsert({
      where: {
        userId_dashboardType: {
          userId,
          dashboardType,
        },
      },
      create: {
        userId,
        dashboardType,
        snapshots,
        customizations,
      },
      update: {
        snapshots,
        customizations,
        updatedAt: new Date(),
      },
    });

    return {
      userId,
      dashboardType,
      snapshots: updated.snapshots as SnapshotConfig[],
      customizations: updated.customizations || undefined,
    };
  } catch (error) {
    logError("Error updating dashboard config", {
      userId,
      dashboardType,
      error,
    });
    throw error;
  }
}

/**
 * Reset dashboard to default configuration
 */
export async function resetDashboardToDefault(
  userId: string,
  dashboardType: DashboardType,
  userRole: RoleType
): Promise<DashboardConfig> {
  const defaultConfig = getDefaultConfig(userRole, dashboardType);

  try {
    // Update or create with defaults
    await prismaClient.userDashboardConfig.upsert({
      where: {
        userId_dashboardType: {
          userId,
          dashboardType,
        },
      },
      create: {
        userId,
        dashboardType,
        snapshots: defaultConfig,
      },
      update: {
        snapshots: defaultConfig,
        customizations: null,
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    logError("Error resetting dashboard config", {
      userId,
      dashboardType,
      error,
    });
  }

  return {
    userId,
    dashboardType,
    snapshots: defaultConfig,
  };
}

/**
 * Get enabled snapshots for a dashboard (sorted by order)
 */
export function getEnabledSnapshots(
  config: DashboardConfig
): { snapshot: SnapshotDefinition; order: number }[] {
  const enabled = config.snapshots
    .filter((s) => s.enabled)
    .sort((a, b) => a.order - b.order);

  const result: Array<{ snapshot: SnapshotDefinition; order: number }> = [];
  for (const snapshotConfig of enabled) {
    const snapshot = getSnapshot(snapshotConfig.snapshotId);
    if (snapshot) {
      result.push({
        snapshot,
        order: snapshotConfig.order,
      });
    }
  }

  return result;
}

/**
 * Reorder snapshots
 */
export function reorderSnapshots(
  snapshots: SnapshotConfig[],
  fromIndex: number,
  toIndex: number
): SnapshotConfig[] {
  const result = [...snapshots];
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);

  // Recalculate order numbers
  return result.map((s, index) => ({
    ...s,
    order: index,
  }));
}

/**
 * Toggle snapshot visibility
 */
export function toggleSnapshot(
  snapshots: SnapshotConfig[],
  snapshotId: string
): SnapshotConfig[] {
  return snapshots.map((s) =>
    s.snapshotId === snapshotId ? { ...s, enabled: !s.enabled } : s
  );
}

/**
 * Cleanup unused configs (admin utility)
 */
export async function cleanupOrphanedConfigs(): Promise<number> {
  try {
    const result = await prismaClient.userDashboardConfig.deleteMany({
      where: {
        User: null,
      },
    });
    return result.count || 0;
  } catch (error) {
    logError("Error cleaning up orphaned dashboard configs", { error });
    return 0;
  }
}
