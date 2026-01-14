import { CronJobDefinition } from './types';
import prisma from '../lib/prisma';
import { socialQueue } from '../worker/queues';

// Phase 5: Enabled social stats update - schema exists and sync services are available
export const updateSocialStatsJob: CronJobDefinition = {
  name: "update-social-stats",
  schedule: "0 */6 * * *",
  description: "Sync social media stats for all connected accounts.",
  handler: async () => {
    try {
      // Get all connected social accounts
      const connections = await prisma.socialAccountConnection.findMany({
        where: { connected: true },
        select: { id: true, platform: true }
      });

      let queued = 0;
      for (const connection of connections) {
        try {
          await socialQueue.add("refresh", {
            connectionId: connection.id,
            platform: connection.platform
          });
          queued++;
        } catch (err) {
          console.error(`Failed to queue sync for connection ${connection.id}:`, err);
        }
      }

      return { 
        queued, 
        total: connections.length,
        message: `Queued ${queued} social sync jobs`
      };
    } catch (error) {
      console.error("update-social-stats job failed:", error);
      throw error; // Fail loudly
    }
  }
};
