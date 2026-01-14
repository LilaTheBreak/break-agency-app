// Phase 5: Enabled social refresh - schema exists and sync services are available
import prisma from '../../lib/prisma';
import { InstagramSyncService } from '../../services/instagram/InstagramSyncService';
import { TikTokSyncService } from '../../services/tiktok/TikTokSyncService';
import { YouTubeSyncService } from '../../services/youtube/YouTubeSyncService';

const instagramSync = new InstagramSyncService();
const tiktokSync = new TikTokSyncService();
const youtubeSync = new YouTubeSyncService();

export default async function socialRefreshProcessor(job: any) {
  try {
    const { connectionId, platform } = job.data || {};
    
    if (!connectionId || !platform) {
      throw new Error("socialRefreshProcessor: missing connectionId or platform in job data");
    }

    // Verify connection exists and is connected
    const connection = await prisma.socialAccountConnection.findUnique({
      where: { id: connectionId }
    });

    if (!connection || !connection.connected) {
      console.warn(`[SOCIAL SYNC] Connection ${connectionId} not found or not connected, skipping`);
      return { skipped: true, reason: "Connection not active" };
    }

    // Route to appropriate sync service
    switch (platform.toLowerCase()) {
      case "instagram":
        await instagramSync.syncProfile(connectionId);
        await instagramSync.syncPosts(connectionId, 25);
        break;
      case "tiktok":
        await tiktokSync.syncProfile(connectionId);
        await tiktokSync.syncPosts(connectionId, 25);
        break;
      case "youtube":
        await youtubeSync.syncProfile(connectionId);
        await youtubeSync.syncVideos(connectionId, 25);
        break;
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }

    console.log(`[SOCIAL SYNC] Successfully synced ${platform} connection ${connectionId}`);
    return { success: true, platform, connectionId };
  } catch (error) {
    console.error("[SOCIAL SYNC] Error syncing social account:", error);
    throw error; // Fail loudly so BullMQ can retry
  }
}
