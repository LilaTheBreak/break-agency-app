import prisma from "../lib/prisma.js";
import { InstagramAuthService } from '../services/instagram/InstagramAuthService.js';
import { InstagramSyncService } from '../services/instagram/InstagramSyncService.js';
import { TikTokAuthService } from '../services/tiktok/TikTokAuthService.js';
import { TikTokSyncService } from '../services/tiktok/TikTokSyncService.js';
const YouTubeAuthService = require('../services/youtube/YouTubeAuthService');
const YouTubeSyncService = require('../services/youtube/YouTubeSyncService');

const instagramAuth = new InstagramAuthService();
const instagramSync = new InstagramSyncService();
const tiktokAuth = new TikTokAuthService();
const tiktokSync = new TikTokSyncService();

/**
 * Daily cron job to sync all connected Instagram accounts
 * Run at 3 AM daily: 0 3 * * *
 */
export async function syncAllInstagramAccounts() {
  console.log('[CRON] Starting Instagram sync job...');

  try {
    // Get all connected Instagram accounts
    const connections = await prisma.socialAccountConnection.findMany({
      where: {
        platform: 'instagram',
        connected: true
      },
      orderBy: {
        lastSyncedAt: 'asc' // Sync oldest first
      }
    });

    console.log(`[CRON] Found ${connections.length} Instagram accounts to sync`);

    let synced = 0;
    let failed = 0;
    let refreshed = 0;

    for (const connection of connections) {
      try {
        // Check if token needs refresh (within 7 days of expiration)
        const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        if (connection.expiresAt && connection.expiresAt < sevenDaysFromNow) {
          console.log(`[CRON] Refreshing token for @${connection.handle}`);
          
          try {
            const refreshedToken = await instagramAuth.refreshToken(connection.accessToken);
            const newExpiresAt = new Date(Date.now() + refreshedToken.expires_in * 1000);
            
            await prisma.socialAccountConnection.update({
              where: { id: connection.id },
              data: {
                accessToken: refreshedToken.access_token,
                expiresAt: newExpiresAt
              }
            });
            
            console.log(`[CRON] Token refreshed for @${connection.handle} (expires: ${newExpiresAt.toISOString()})`);
            refreshed++;
          } catch (refreshError) {
            console.error(`[CRON] Failed to refresh token for @${connection.handle}:`, refreshError.message);
            // Continue with old token and try to sync anyway
          }
        }

        // Sync profile
        await instagramSync.syncProfile(connection.id);
        console.log(`[CRON] ✓ Synced profile for @${connection.handle}`);

        // Sync recent posts (last 25 posts)
        const postsResult = await instagramSync.syncPosts(connection.id, 25);
        console.log(`[CRON] ✓ Synced ${postsResult.synced}/${postsResult.total} posts for @${connection.handle}`);

        synced++;

        // Wait 2 seconds between accounts to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`[CRON] ✗ Failed to sync @${connection.handle}:`, error.message);
        failed++;

        // If rate limit hit, stop processing more accounts
        if (error.message === 'RATE_LIMIT_HIT') {
          console.error('[CRON] Rate limit hit, stopping sync job');
          break;
        }
      }
    }

    const summary = {
      total: connections.length,
      synced,
      failed,
      refreshed,
      completedAt: new Date().toISOString()
    };

    console.log('[CRON] Instagram sync job complete:', summary);
    
    return summary;
  } catch (error) {
    console.error('[CRON] Instagram sync job failed:', error);
    throw error;
  }
}

/**
 * Daily cron job to sync all connected TikTok accounts
 * Run at 3:30 AM daily: 30 3 * * *
 */
export async function syncAllTikTokAccounts() {
  console.log('[CRON] Starting TikTok sync job...');

  try {
    // Get all connected TikTok accounts
    const connections = await prisma.socialAccountConnection.findMany({
      where: {
        platform: 'tiktok',
        connected: true
      },
      orderBy: {
        lastSyncedAt: 'asc' // Sync oldest first
      }
    });

    console.log(`[CRON] Found ${connections.length} TikTok accounts to sync`);

    let synced = 0;
    let failed = 0;
    let refreshed = 0;

    for (const connection of connections) {
      try {
        // TikTok tokens expire in 24 hours - refresh if needed
        if (connection.expiresAt && connection.expiresAt < new Date()) {
          console.log(`[CRON] Refreshing token for @${connection.handle}`);
          
          try {
            const refreshedToken = await tiktokAuth.refreshToken(connection.refreshToken);
            const newExpiresAt = new Date(Date.now() + refreshedToken.expires_in * 1000);
            
            await prisma.socialAccountConnection.update({
              where: { id: connection.id },
              data: {
                accessToken: refreshedToken.access_token,
                refreshToken: refreshedToken.refresh_token,
                expiresAt: newExpiresAt
              }
            });
            
            console.log(`[CRON] Token refreshed for @${connection.handle}`);
            refreshed++;
          } catch (refreshError) {
            console.error(`[CRON] Failed to refresh token for @${connection.handle}:`, refreshError.message);
            failed++;
            continue; // Skip this account if token refresh failed
          }
        }

        // Sync profile
        await tiktokSync.syncProfile(connection.id);
        console.log(`[CRON] ✓ Synced profile for @${connection.handle}`);

        // Sync recent videos (last 20 videos - TikTok API limit)
        const videosResult = await tiktokSync.syncVideos(connection.id, 20);
        console.log(`[CRON] ✓ Synced ${videosResult.synced}/${videosResult.total} videos for @${connection.handle}`);

        synced++;

        // Wait 3 seconds between accounts to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 3000));
      } catch (error) {
        console.error(`[CRON] ✗ Failed to sync @${connection.handle}:`, error.message);
        failed++;

        // If rate limit hit, stop processing more accounts
        if (error.message === 'RATE_LIMIT_HIT') {
          console.error('[CRON] Rate limit hit, stopping TikTok sync job');
          break;
        }
      }
    }

    const summary = {
      total: connections.length,
      synced,
      failed,
      refreshed,
      completedAt: new Date().toISOString()
    };

    console.log('[CRON] TikTok sync job complete:', summary);
    
    return summary;
  } catch (error) {
    console.error('[CRON] TikTok sync job failed:', error);
    throw error;
  }
}

/**
 * Daily cron job to sync all connected YouTube accounts
 * Run at 4 AM daily: 0 4 * * *
 */
export async function syncAllYouTubeAccounts() {
  console.log('[CRON] Starting YouTube sync job...');

  try {
    // Get all connected YouTube accounts
    const connections = await prisma.socialAccountConnection.findMany({
      where: {
        platform: 'YOUTUBE',
        isActive: true
      },
      orderBy: {
        lastSyncedAt: 'asc' // Sync oldest first
      }
    });

    console.log(`[CRON] Found ${connections.length} YouTube accounts to sync`);

    let synced = 0;
    let failed = 0;
    let refreshed = 0;

    for (const connection of connections) {
      try {
        // YouTube tokens expire in ~1 hour - ensure valid token
        const accessToken = await YouTubeAuthService.ensureValidToken(connection);
        
        if (accessToken !== connection.accessToken) {
          console.log(`[CRON] Token refreshed for channel ${connection.platformId}`);
          refreshed++;
        }

        // Get user ID from connection
        const user = await prisma.user.findUnique({
          where: { id: connection.userId }
        });

        if (!user) {
          console.error(`[CRON] User not found for connection ${connection.id}`);
          failed++;
          continue;
        }

        // Sync profile
        await YouTubeSyncService.syncProfile(user.id, connection.id);
        console.log(`[CRON] ✓ Synced profile for channel ${connection.platformId}`);

        // Sync recent videos (last 50 videos)
        const videosResult = await YouTubeSyncService.syncVideos(user.id, connection.id, 50);
        console.log(`[CRON] ✓ Synced ${videosResult.postsCount} videos for channel ${connection.platformId}`);

        synced++;

        // Wait 2 seconds between accounts to respect rate limits
        // YouTube has quota of 10,000 units per day (very generous)
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`[CRON] ✗ Failed to sync channel ${connection.platformId}:`, error.message);
        failed++;

        // Continue processing other accounts even if one fails
      }
    }

    const summary = {
      total: connections.length,
      synced,
      failed,
      refreshed,
      completedAt: new Date().toISOString()
    };

    console.log('[CRON] YouTube sync job complete:', summary);
    
    return summary;
  } catch (error) {
    console.error('[CRON] YouTube sync job failed:', error);
    throw error;
  }
}

/**
 * Master sync job - runs Instagram, TikTok, and YouTube syncs
 * Run at 3 AM daily: 0 3 * * *
 */
export async function syncAllSocialAccounts() {
  console.log('[CRON] Starting master social sync job...');
  
  const results = {
    instagram: null,
    tiktok: null,
    youtube: null,
    startedAt: new Date().toISOString()
  };

  try {
    // Run Instagram sync
    results.instagram = await syncAllInstagramAccounts();
    
    // Wait 5 minutes between platform syncs
    await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000));
    
    // Run TikTok sync
    results.tiktok = await syncAllTikTokAccounts();
    
    // Wait 5 minutes between platform syncs
    await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000));
    
    // Run YouTube sync
    results.youtube = await syncAllYouTubeAccounts();
    
    console.log('[CRON] Master social sync job complete:', results);
    return results;
  } catch (error) {
    console.error('[CRON] Master social sync job failed:', error);
    throw error;
  }
}

/**
 * Manual trigger for testing
 * Usage: node -e "import('./syncSocialAnalytics.js').then(m => m.syncAllSocialAccounts())"
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  syncAllSocialAccounts()
    .then(result => {
      console.log('Sync complete:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('Sync failed:', error);
      process.exit(1);
    });
}
