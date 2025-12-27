import express from 'express';
import { TikTokAuthService } from '../../services/tiktok/TikTokAuthService.js';
import { TikTokSyncService } from '../../services/tiktok/TikTokSyncService.js';
import { requireAuth } from '../../middleware/auth.js';
import prisma from '../../lib/prisma.js';

const router = express.Router();
const tiktokAuth = new TikTokAuthService();
const tiktokSync = new TikTokSyncService();

/**
 * GET /api/auth/tiktok/connect
 * Initiate TikTok OAuth flow
 */
router.get('/connect', requireAuth, (req, res) => {
  try {
    const authUrl = tiktokAuth.getAuthorizationUrl(req.userId);
    res.json({ success: true, url: authUrl });
  } catch (error) {
    console.error('TikTok connect error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to initiate TikTok connection',
      message: error.message
    });
  }
});

/**
 * GET /api/auth/tiktok/callback
 * Handle TikTok OAuth callback
 */
router.get('/callback', async (req, res) => {
  try {
    const { code, state, error, error_description } = req.query;
    
    // Handle user denial or errors
    if (error) {
      console.log('TikTok auth error:', error, error_description);
      return res.redirect('/dashboard?error=tiktok_auth_denied');
    }

    if (!code || !state) {
      return res.redirect('/dashboard?error=tiktok_auth_failed');
    }

    // Decode state to get userId
    const { userId } = JSON.parse(Buffer.from(state, 'base64').toString());

    // Exchange code for access token
    const tokenData = await tiktokAuth.exchangeCodeForToken(code);
    
    // Get user profile
    const profile = await tiktokAuth.getUserProfile(tokenData.access_token);

    // Extract username from profile deep link
    const handle = profile.profile_deep_link ? 
      profile.profile_deep_link.match(/@([^?/]+)/)?.[1] : 
      profile.display_name;

    // Calculate expiration date (TikTok tokens expire in 24 hours)
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);
    
    // Save connection to database
    const connection = await prisma.socialAccountConnection.upsert({
      where: {
        creatorId_platform: {
          creatorId: userId,
          platform: 'tiktok'
        }
      },
      create: {
        id: `tt_${userId}_${Date.now()}`,
        creatorId: userId,
        platform: 'tiktok',
        handle: handle || profile.display_name,
        connected: true,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt,
        metadata: {
          openId: tokenData.open_id,
          scope: tokenData.scope,
          externalId: profile.open_id
        }
      },
      update: {
        connected: true,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt,
        handle: handle || profile.display_name,
        metadata: {
          openId: tokenData.open_id,
          scope: tokenData.scope,
          externalId: profile.open_id
        }
      }
    });

    // Trigger initial sync in background (don't wait)
    tiktokSync.syncProfile(connection.id)
      .then(() => tiktokSync.syncVideos(connection.id, 10))
      .catch(err => console.error('Initial TikTok sync failed:', err));

    res.redirect('/dashboard?success=tiktok_connected');
  } catch (error) {
    console.error('TikTok callback error:', error);
    res.redirect('/dashboard?error=tiktok_auth_failed');
  }
});

/**
 * DELETE /api/auth/tiktok/disconnect
 * Disconnect TikTok account
 */
router.delete('/disconnect', requireAuth, async (req, res) => {
  try {
    const connection = await prisma.socialAccountConnection.findFirst({
      where: {
        creatorId: req.userId,
        platform: 'tiktok',
        connected: true
      }
    });

    if (connection && connection.accessToken) {
      // Try to revoke token with TikTok
      await tiktokAuth.revokeToken(connection.accessToken).catch(err => 
        console.warn('TikTok token revoke failed:', err)
      );
    }

    // Update database
    await prisma.socialAccountConnection.updateMany({
      where: {
        creatorId: req.userId,
        platform: 'tiktok'
      },
      data: {
        connected: false,
        accessToken: null,
        refreshToken: null,
        expiresAt: null
      }
    });

    res.json({ success: true, message: 'TikTok disconnected successfully' });
  } catch (error) {
    console.error('TikTok disconnect error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to disconnect TikTok' 
    });
  }
});

/**
 * POST /api/auth/tiktok/sync
 * Manually trigger sync for connected account
 */
router.post('/sync', requireAuth, async (req, res) => {
  try {
    const connection = await prisma.socialAccountConnection.findFirst({
      where: {
        creatorId: req.userId,
        platform: 'tiktok',
        connected: true
      }
    });

    if (!connection) {
      return res.status(404).json({ 
        success: false, 
        error: 'No connected TikTok account found' 
      });
    }

    // Check if token needs refresh (TikTok tokens expire in 24 hours)
    if (connection.expiresAt && connection.expiresAt < new Date()) {
      console.log('Refreshing expired TikTok token...');
      const refreshedToken = await tiktokAuth.refreshToken(connection.refreshToken);
      
      await prisma.socialAccountConnection.update({
        where: { id: connection.id },
        data: {
          accessToken: refreshedToken.access_token,
          refreshToken: refreshedToken.refresh_token,
          expiresAt: new Date(Date.now() + refreshedToken.expires_in * 1000)
        }
      });
    }

    // Sync profile and videos
    await tiktokSync.syncProfile(connection.id);
    const videosResult = await tiktokSync.syncVideos(connection.id, 10);

    res.json({ 
      success: true, 
      message: 'Sync completed',
      data: {
        profileSynced: true,
        videosSynced: videosResult.synced,
        totalVideos: videosResult.total
      }
    });
  } catch (error) {
    console.error('TikTok sync error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to sync TikTok data',
      message: error.message
    });
  }
});

export default router;
