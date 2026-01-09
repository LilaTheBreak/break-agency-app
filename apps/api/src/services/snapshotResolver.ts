/**
 * Snapshot Resolver
 *
 * Fetches data for dashboard snapshots based on their dataSource.
 * Each resolver:
 * - Fetches only enabled snapshots
 * - Handles errors independently (one failure doesn't crash dashboard)
 * - Returns structured data ready for UI rendering
 * - Supports caching for frequently accessed data
 */

import prisma from "../lib/prisma.js";
import { SnapshotDefinition } from "./snapshotRegistry.js";
import { logError } from "../lib/logger.js";

const prismaClient = prisma as any;

export interface SnapshotData {
  snapshotId: string;
  title: string;
  metricType: string;
  value: any;
  description?: string;
  error?: string;
  icon?: string;
  color?: string;
}

/**
 * Data resolvers map data sources to fetcher functions
 */
type DataResolver = (
  userId: string,
  params?: Record<string, any>
) => Promise<any>;

const dataResolvers: Record<string, DataResolver> = {
  // ─────── ADMIN RESOLVERS ───────

  "tasks.due": async (userId: string) => {
    // Fetch tasks due in next 7 days
    // TODO: Implement based on your Task model
    try {
      const tasks = await prismaClient.task.findMany({
        where: {
          assignedToId: userId,
          dueDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        },
        select: { id: true },
      });
      return tasks.length;
    } catch (error) {
      logError("Error fetching tasks due", { userId, error });
      return 0;
    }
  },

  "approvals.pending": async (userId: string) => {
    // Fetch pending deal approvals
    try {
      const pending = await prismaClient.deal.findMany({
        where: {
          status: "PENDING_APPROVAL",
        },
        select: { id: true },
      });
      return pending.length;
    } catch (error) {
      logError("Error fetching pending approvals", { userId, error });
      return 0;
    }
  },

  "payouts.pending": async (userId: string) => {
    // Fetch total pending payouts
    try {
      const payouts = await prismaClient.payout.findMany({
        where: {
          status: "PENDING",
        },
        select: { amount: true },
      });
      return payouts.reduce((sum, p) => sum + (p.amount || 0), 0);
    } catch (error) {
      logError("Error fetching pending payouts", { userId, error });
      return 0;
    }
  },

  "briefs.pending_review": async (userId: string) => {
    // Fetch briefs needing review
    try {
      const briefs = await prismaClient.brief.findMany({
        where: {
          status: "DRAFT",
        },
        select: { id: true },
      });
      return briefs.length;
    } catch (error) {
      logError("Error fetching briefs needing review", { userId, error });
      return 0;
    }
  },

  "talent.exclusive_overview": async (userId: string) => {
    // Fetch exclusive talent overview data
    try {
      const exclusiveTalent = await prismaClient.talent.findMany({
        where: {
          representationType: "EXCLUSIVE",
        },
        select: {
          id: true,
          totalDeals: true,
          activeDeals: true,
        },
      });
      return {
        totalTalent: exclusiveTalent.length,
        totalDeals: exclusiveTalent.reduce((sum, t) => sum + (t.totalDeals || 0), 0),
        activeDeals: exclusiveTalent.reduce((sum, t) => sum + (t.activeDeals || 0), 0),
      };
    } catch (error) {
      logError("Error fetching exclusive talent overview", { userId, error });
      return {
        totalTalent: 0,
        totalDeals: 0,
        activeDeals: 0,
      };
    }
  },

  // ─────── TALENT RESOLVERS ───────

  "deals.active": async (userId: string) => {
    // Fetch active deals for talent
    try {
      const talent = await prismaClient.talent.findFirst({
        where: { userId },
        select: { id: true },
      });

      if (!talent) return 0;

      const deals = await prismaClient.deal.findMany({
        where: {
          talentId: talent.id,
          status: "ACTIVE",
        },
        select: { id: true },
      });
      return deals.length;
    } catch (error) {
      logError("Error fetching active deals", { userId, error });
      return 0;
    }
  },

  "content.due_soon": async (userId: string) => {
    // Fetch content due soon
    try {
      const talent = await prismaClient.talent.findFirst({
        where: { userId },
        select: { id: true },
      });

      if (!talent) return 0;

      const content = await prismaClient.content.findMany({
        where: {
          talentId: talent.id,
          dueDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        },
        select: { id: true },
      });
      return content.length;
    } catch (error) {
      logError("Error fetching content due soon", { userId, error });
      return 0;
    }
  },

  "payouts.talent_pending": async (userId: string) => {
    // Fetch pending payouts for talent
    try {
      const talent = await prismaClient.talent.findFirst({
        where: { userId },
        select: { id: true },
      });

      if (!talent) return 0;

      const payouts = await prismaClient.payout.findMany({
        where: {
          talentId: talent.id,
          status: "PENDING",
        },
        select: { amount: true },
      });
      return payouts.reduce((sum, p) => sum + (p.amount || 0), 0);
    } catch (error) {
      logError("Error fetching talent pending payouts", { userId, error });
      return 0;
    }
  },

  "opportunities.new": async (userId: string) => {
    // Fetch new opportunities
    try {
      const talent = await prismaClient.talent.findFirst({
        where: { userId },
        select: { id: true },
      });

      if (!talent) return 0;

      const opportunities = await prismaClient.opportunity.findMany({
        where: {
          status: "AVAILABLE",
        },
        select: { id: true },
      });
      return opportunities.length;
    } catch (error) {
      logError("Error fetching opportunities", { userId, error });
      return 0;
    }
  },

  // ─────── EXCLUSIVE TALENT RESOLVERS ───────

  "revenue.total": async (userId: string) => {
    // Fetch total revenue from all sources
    try {
      const talent = await prismaClient.talent.findFirst({
        where: { userId },
        select: { id: true },
      });

      if (!talent) return 0;

      const events = await prismaClient.revenueEvent.findMany({
        where: {
          RevenueSource: {
            talentId: talent.id,
          },
        },
        select: { netAmount: true },
      });

      return events.reduce((sum, e) => sum + (e.netAmount || 0), 0);
    } catch (error) {
      logError("Error fetching total revenue", { userId, error });
      return 0;
    }
  },

  "revenue.deals": async (userId: string) => {
    // Fetch revenue from deals
    try {
      const talent = await prismaClient.talent.findFirst({
        where: { userId },
        select: { id: true },
      });

      if (!talent) return 0;

      const deals = await prismaClient.deal.findMany({
        where: {
          talentId: talent.id,
          status: "COMPLETED",
        },
        select: { fee: true },
      });

      return deals.reduce((sum, d) => sum + (d.fee || 0), 0);
    } catch (error) {
      logError("Error fetching deal revenue", { userId, error });
      return 0;
    }
  },

  "revenue.commerce": async (userId: string) => {
    // Fetch revenue from commerce platforms
    try {
      const talent = await prismaClient.talent.findFirst({
        where: { userId },
        select: { id: true },
      });

      if (!talent) return 0;

      const sources = await prismaClient.revenueSource.findMany({
        where: {
          talentId: talent.id,
          platform: {
            in: ["SHOPIFY", "TIKTOK_SHOP", "LTK", "AMAZON", "CUSTOM"],
          },
        },
        select: { id: true },
      });

      if (sources.length === 0) return 0;

      const sourceIds = sources.map((s) => s.id);
      const events = await prismaClient.revenueEvent.findMany({
        where: {
          revenueSourceId: {
            in: sourceIds,
          },
        },
        select: { netAmount: true },
      });

      return events.reduce((sum, e) => sum + (e.netAmount || 0), 0);
    } catch (error) {
      logError("Error fetching commerce revenue", { userId, error });
      return 0;
    }
  },

  "revenue.goal_progress": async (userId: string) => {
    // Fetch goal progress percentage
    try {
      const talent = await prismaClient.talent.findFirst({
        where: { userId },
        select: { id: true },
      });

      if (!talent) return 0;

      const goals = await prismaClient.revenueGoal.findMany({
        where: {
          talentId: talent.id,
        },
        select: { targetAmount: true, id: true },
      });

      if (goals.length === 0) return 0;

      // Get current revenue
      const events = await prismaClient.revenueEvent.findMany({
        where: {
          RevenueSource: {
            talentId: talent.id,
          },
        },
        select: { netAmount: true },
      });

      const currentRevenue = events.reduce((sum, e) => sum + (e.netAmount || 0), 0);
      const targetRevenue = goals.reduce((sum, g) => sum + (g.targetAmount || 0), 0);

      if (targetRevenue === 0) return 0;

      return Math.round((currentRevenue / targetRevenue) * 100);
    } catch (error) {
      logError("Error fetching goal progress", { userId, error });
      return 0;
    }
  },

  "payouts.exclusive_pending": async (userId: string) => {
    // Fetch pending payouts for exclusive talent
    try {
      const talent = await prismaClient.talent.findFirst({
        where: { userId, representationType: "EXCLUSIVE" },
        select: { id: true },
      });

      if (!talent) return 0;

      const payouts = await prismaClient.payout.findMany({
        where: {
          talentId: talent.id,
          status: "PENDING",
        },
        select: { amount: true },
      });

      return payouts.reduce((sum, p) => sum + (p.amount || 0), 0);
    } catch (error) {
      logError("Error fetching exclusive pending payouts", { userId, error });
      return 0;
    }
  },
};

/**
 * Resolve data for a single snapshot
 */
export async function resolveSnapshotData(
  snapshot: SnapshotDefinition,
  userId: string
): Promise<SnapshotData> {
  const resolver = dataResolvers[snapshot.dataSource];

  if (!resolver) {
    return {
      snapshotId: snapshot.id,
      title: snapshot.title,
      metricType: snapshot.metricType,
      value: null,
      error: `Data source ${snapshot.dataSource} not implemented`,
      icon: snapshot.icon,
      color: snapshot.color,
    };
  }

  try {
    const value = await resolver(userId, snapshot.params);

    return {
      snapshotId: snapshot.id,
      title: snapshot.title,
      metricType: snapshot.metricType,
      value,
      description: snapshot.description,
      icon: snapshot.icon,
      color: snapshot.color,
    };
  } catch (error) {
    logError("Error resolving snapshot data", {
      snapshotId: snapshot.id,
      dataSource: snapshot.dataSource,
      error,
    });

    return {
      snapshotId: snapshot.id,
      title: snapshot.title,
      metricType: snapshot.metricType,
      value: null,
      error: "Failed to load snapshot data",
      icon: snapshot.icon,
      color: snapshot.color,
    };
  }
}

/**
 * Resolve data for multiple snapshots in parallel
 */
export async function resolveSnapshotsData(
  snapshots: SnapshotDefinition[],
  userId: string
): Promise<SnapshotData[]> {
  const promises = snapshots.map((snapshot) => resolveSnapshotData(snapshot, userId));
  return Promise.all(promises);
}
