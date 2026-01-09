/**
 * Dashboard Snapshot Registry
 *
 * Centralized registry of all available dashboard snapshot cards.
 * Each snapshot definition describes:
 * - How to identify it (id, key)
 * - What to display (title, description)
 * - What data it shows (metricType)
 * - Who can see it (roleVisibility)
 * - How to fetch its data (dataSource)
 *
 * This enables:
 * ✓ User customization (show/hide, reorder)
 * ✓ Role-based defaults
 * ✓ Future-proof new card types
 * ✓ Centralized snapshot management
 */

export type MetricType = "count" | "currency" | "percentage" | "status" | "list" | "custom";
export type DashboardType = "ADMIN_OVERVIEW" | "TALENT_OVERVIEW" | "EXCLUSIVE_TALENT_OVERVIEW";
export type RoleType = "ADMIN" | "TALENT" | "EXCLUSIVE";

export interface SnapshotDefinition {
  /**
   * Unique identifier for this snapshot
   * e.g. "TASKS_DUE", "REVENUE_TOTAL", "DEALS_ACTIVE"
   */
  id: string;

  /**
   * Internal key for lookup and caching
   */
  key: string;

  /**
   * Display title shown to user
   */
  title: string;

  /**
   * Description for tooltip/help
   */
  description: string;

  /**
   * Type of metric displayed
   */
  metricType: MetricType;

  /**
   * Icon name (for UI)
   */
  icon?: string;

  /**
   * Color theme (for UI)
   */
  color?: "blue" | "green" | "purple" | "amber" | "red" | "pink";

  /**
   * Data source identifier for resolver
   * Used to call the appropriate data fetcher
   */
  dataSource: string;

  /**
   * Which roles can see this snapshot
   */
  roleVisibility: RoleType[];

  /**
   * Whether snapshot is enabled by default
   */
  defaultEnabled: boolean;

  /**
   * Default position in dashboard
   */
  defaultOrder: number;

  /**
   * Which dashboard(s) can display this snapshot
   */
  dashboardTypes: DashboardType[];

  /**
   * Optional: custom parameters for data fetching
   */
  params?: Record<string, any>;

  /**
   * Optional: category for grouping in customizer UI
   */
  category?: "revenue" | "deals" | "content" | "tasks" | "approvals" | "system";

  /**
   * Optional: help text for customizer
   */
  helpText?: string;
}

/**
 * Snapshot Registry
 * Central list of all available snapshots
 */
export const SNAPSHOT_REGISTRY: Record<string, SnapshotDefinition> = {
  // ───── ADMIN SNAPSHOTS ─────

  TASKS_DUE: {
    id: "TASKS_DUE",
    key: "tasks_due",
    title: "Tasks Due",
    description: "Team tasks due in the next 7 days",
    metricType: "count",
    icon: "CheckSquare",
    color: "blue",
    dataSource: "tasks.due",
    roleVisibility: ["ADMIN"],
    defaultEnabled: true,
    defaultOrder: 1,
    dashboardTypes: ["ADMIN_OVERVIEW"],
    category: "tasks",
  },

  PENDING_APPROVALS: {
    id: "PENDING_APPROVALS",
    key: "pending_approvals",
    title: "Pending Approvals",
    description: "Deals waiting for admin approval",
    metricType: "count",
    icon: "ClipboardCheck",
    color: "amber",
    dataSource: "approvals.pending",
    roleVisibility: ["ADMIN"],
    defaultEnabled: true,
    defaultOrder: 2,
    dashboardTypes: ["ADMIN_OVERVIEW"],
    category: "approvals",
  },

  PAYOUTS_PENDING: {
    id: "PAYOUTS_PENDING",
    key: "payouts_pending",
    title: "Payouts Pending",
    description: "Total payouts awaiting processing",
    metricType: "currency",
    icon: "DollarSign",
    color: "green",
    dataSource: "payouts.pending",
    roleVisibility: ["ADMIN", "TALENT", "EXCLUSIVE"],
    defaultEnabled: true,
    defaultOrder: 3,
    dashboardTypes: ["ADMIN_OVERVIEW"],
    category: "revenue",
  },

  BRIEFS_NEEDING_REVIEW: {
    id: "BRIEFS_NEEDING_REVIEW",
    key: "briefs_needing_review",
    title: "Briefs Needing Review",
    description: "Brand briefs awaiting feedback",
    metricType: "count",
    icon: "FileText",
    color: "purple",
    dataSource: "briefs.pending_review",
    roleVisibility: ["ADMIN"],
    defaultEnabled: true,
    defaultOrder: 4,
    dashboardTypes: ["ADMIN_OVERVIEW"],
    category: "content",
  },

  EXCLUSIVE_TALENT_SNAPSHOT: {
    id: "EXCLUSIVE_TALENT_SNAPSHOT",
    key: "exclusive_talent_snapshot",
    title: "Exclusive Talent Overview",
    description: "Summary of exclusive talent performance",
    metricType: "custom",
    icon: "Star",
    color: "pink",
    dataSource: "talent.exclusive_overview",
    roleVisibility: ["ADMIN"],
    defaultEnabled: true,
    defaultOrder: 5,
    dashboardTypes: ["ADMIN_OVERVIEW"],
    category: "system",
    helpText: "Shows key metrics for exclusive talent members",
  },

  // ───── TALENT SNAPSHOTS ─────

  ACTIVE_DEALS: {
    id: "ACTIVE_DEALS",
    key: "active_deals",
    title: "Active Deals",
    description: "Deals currently in progress",
    metricType: "count",
    icon: "Handshake",
    color: "green",
    dataSource: "deals.active",
    roleVisibility: ["TALENT", "EXCLUSIVE"],
    defaultEnabled: true,
    defaultOrder: 1,
    dashboardTypes: ["TALENT_OVERVIEW"],
    category: "deals",
  },

  CONTENT_DUE: {
    id: "CONTENT_DUE",
    key: "content_due",
    title: "Content Due",
    description: "Content deliverables due soon",
    metricType: "count",
    icon: "Video",
    color: "amber",
    dataSource: "content.due_soon",
    roleVisibility: ["TALENT", "EXCLUSIVE"],
    defaultEnabled: true,
    defaultOrder: 2,
    dashboardTypes: ["TALENT_OVERVIEW"],
    category: "content",
  },

  TALENT_PAYOUTS_PENDING: {
    id: "TALENT_PAYOUTS_PENDING",
    key: "talent_payouts_pending",
    title: "Payouts Pending",
    description: "Your payouts awaiting processing",
    metricType: "currency",
    icon: "DollarSign",
    color: "green",
    dataSource: "payouts.talent_pending",
    roleVisibility: ["TALENT", "EXCLUSIVE"],
    defaultEnabled: true,
    defaultOrder: 3,
    dashboardTypes: ["TALENT_OVERVIEW"],
    category: "revenue",
  },

  OPPORTUNITIES: {
    id: "OPPORTUNITIES",
    key: "opportunities",
    title: "New Opportunities",
    description: "Opportunities matching your profile",
    metricType: "count",
    icon: "Sparkles",
    color: "blue",
    dataSource: "opportunities.new",
    roleVisibility: ["TALENT", "EXCLUSIVE"],
    defaultEnabled: true,
    defaultOrder: 4,
    dashboardTypes: ["TALENT_OVERVIEW"],
    category: "deals",
  },

  // ───── EXCLUSIVE TALENT SNAPSHOTS ─────

  TOTAL_REVENUE: {
    id: "TOTAL_REVENUE",
    key: "total_revenue",
    title: "Total Revenue",
    description: "Revenue from all sources",
    metricType: "currency",
    icon: "TrendingUp",
    color: "green",
    dataSource: "revenue.total",
    roleVisibility: ["EXCLUSIVE"],
    defaultEnabled: true,
    defaultOrder: 1,
    dashboardTypes: ["EXCLUSIVE_TALENT_OVERVIEW"],
    category: "revenue",
  },

  DEAL_REVENUE: {
    id: "DEAL_REVENUE",
    key: "deal_revenue",
    title: "Deal Revenue",
    description: "Revenue from sponsored deals",
    metricType: "currency",
    icon: "Handshake",
    color: "blue",
    dataSource: "revenue.deals",
    roleVisibility: ["EXCLUSIVE"],
    defaultEnabled: true,
    defaultOrder: 2,
    dashboardTypes: ["EXCLUSIVE_TALENT_OVERVIEW"],
    category: "revenue",
  },

  COMMERCE_REVENUE: {
    id: "COMMERCE_REVENUE",
    key: "commerce_revenue",
    title: "Commerce Revenue",
    description: "Revenue from Shopify, TikTok, LTK, Amazon",
    metricType: "currency",
    icon: "ShoppingCart",
    color: "purple",
    dataSource: "revenue.commerce",
    roleVisibility: ["EXCLUSIVE"],
    defaultEnabled: true,
    defaultOrder: 3,
    dashboardTypes: ["EXCLUSIVE_TALENT_OVERVIEW"],
    category: "revenue",
  },

  REVENUE_GOAL_PROGRESS: {
    id: "REVENUE_GOAL_PROGRESS",
    key: "revenue_goal_progress",
    title: "Goal Progress",
    description: "Progress toward revenue goals",
    metricType: "percentage",
    icon: "Target",
    color: "amber",
    dataSource: "revenue.goal_progress",
    roleVisibility: ["EXCLUSIVE"],
    defaultEnabled: true,
    defaultOrder: 4,
    dashboardTypes: ["EXCLUSIVE_TALENT_OVERVIEW"],
    category: "revenue",
  },

  EXCLUSIVE_PAYOUTS_PENDING: {
    id: "EXCLUSIVE_PAYOUTS_PENDING",
    key: "exclusive_payouts_pending",
    title: "Payouts Pending",
    description: "Pending payouts from all sources",
    metricType: "currency",
    icon: "DollarSign",
    color: "green",
    dataSource: "payouts.exclusive_pending",
    roleVisibility: ["EXCLUSIVE"],
    defaultEnabled: true,
    defaultOrder: 5,
    dashboardTypes: ["EXCLUSIVE_TALENT_OVERVIEW"],
    category: "revenue",
  },
};

/**
 * Get all snapshots for a dashboard type and role
 */
export function getSnapshotsForRole(
  role: RoleType,
  dashboardType: DashboardType
): SnapshotDefinition[] {
  return Object.values(SNAPSHOT_REGISTRY).filter(
    (snapshot) =>
      snapshot.roleVisibility.includes(role) &&
      snapshot.dashboardTypes.includes(dashboardType)
  );
}

/**
 * Get default snapshot configuration for a role
 */
export function getDefaultConfig(
  role: RoleType,
  dashboardType: DashboardType
): Array<{ snapshotId: string; enabled: boolean; order: number }> {
  return getSnapshotsForRole(role, dashboardType)
    .filter((s) => s.defaultEnabled)
    .sort((a, b) => a.defaultOrder - b.defaultOrder)
    .map((s, index) => ({
      snapshotId: s.id,
      enabled: s.defaultEnabled,
      order: index,
    }));
}

/**
 * Get a snapshot definition by ID
 */
export function getSnapshot(snapshotId: string): SnapshotDefinition | null {
  return SNAPSHOT_REGISTRY[snapshotId] || null;
}

/**
 * Validate that a snapshot exists and is accessible for a role
 */
export function validateSnapshot(
  snapshotId: string,
  role: RoleType,
  dashboardType: DashboardType
): boolean {
  const snapshot = getSnapshot(snapshotId);
  if (!snapshot) return false;

  return (
    snapshot.roleVisibility.includes(role) &&
    snapshot.dashboardTypes.includes(dashboardType)
  );
}
