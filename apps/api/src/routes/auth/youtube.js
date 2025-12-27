const express = require('express');
const { PrismaClient } = require('@prisma/client');
const YouTubeAuthService = require('../../services/youtube/YouTubeAuthService');
const YouTubeSyncService = require('../../services/youtube/YouTubeSyncService');
const { requireAuth } = require('../../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/auth/youtube/connect
 * Initialize YouTube OAuth flow
 */
router.get('/connect', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Generate OAuth URL with user ID in state
    const authUrl = YouTubeAuthService.getAuthorizationUrl(userId.toString());

    res.json({ authUrl });
  } catch (error) {
    console.error('YouTube connect error:', error);
    res.status(500).json({ error: 'Failed to initialize YouTube connection' });
  }
});

/**
 * GET /api/auth/youtube/callback
 * Handle YouTube OAuth callback
 */
router.get('/callback', async (req, res) => {
  try {
    const { code, state, error } = req.query;

    // Handle user denial
    if (error) {
      return res.redirect(`${process.env.WEB_URL}/dashboard/exclusive?youtube_error=access_denied`);
    }

    if (!code || !state) {
      return res.redirect(`${process.env.WEB_URL}/dashboard/exclusive?youtube_error=missing_params`);
    }

    const userId = parseInt(state);
    if (isNaN(userId)) {
      return res.redirect(`${process.env.WEB_URL}/dashboard/exclusive?youtube_error=invalid_state`);
    }

    // Exchange code for tokens
    const tokenData = await YouTubeAuthService.exchangeCodeForToken(code);

    // Get channel info
    const channelInfo = await YouTubeAuthService.getChannelInfo(tokenData.accessToken);

    // Check if connection already exists
    const existingConnection = await prisma.socialAccountConnection.findFirst({
      where: {
        userId,
        platform: 'YOUTUBE',
        platformId: channelInfo.platformId
      }
    });

    if (existingConnection) {
      // Update existing connection
      await prisma.socialAccountConnection.update({
        where: { id: existingConnection.id },
        data: {
          accessToken: tokenData.accessToken,
          refreshToken: tokenData.refreshToken || existingConnection.refreshToken,
          expiresAt: new Date(tokenData.expiresIn),
          isActive: true,
          lastSyncedAt: new Date()
        }
      });
    } else {
      // Create new connection
      await prisma.socialAccountConnection.create({
        data: {
          userId,
          platform: 'YOUTUBE',
          platformId: channelInfo.platformId,
          accessToken: tokenData.accessToken,
          refreshToken: tokenData.refreshToken,
          expiresAt: new Date(tokenData.expiresIn),
          isActive: true,
          lastSyncedAt: new Date()
        }
      });
    }

    // Trigger initial sync in background (don't await)
    const connection = await prisma.socialAccountConnection.findFirst({
      where: {
        userId,
        platform: 'YOUTUBE',
        platformId: channelInfo.platformId
      }
    });

    if (connection) {
      // Sync profile and videos in background
      YouTubeSyncService.syncProfile(userId, connection.id)
        .then(() => YouTubeSyncService.syncVideos(userId, connection.id, 25))
        .catch(err => console.error('Background YouTube sync failed:', err));
    }

    // Redirect back to dashboard with success
    res.redirect(`${process.env.WEB_URL}/dashboard/exclusive?youtube_connected=true`);
  } catch (error) {
    console.error('YouTube callback error:', error);
    res.redirect(`${process.env.WEB_URL}/dashboard/exclusive?youtube_error=callback_failed`);
  }
});

/**
 * DELETE /api/auth/youtube/disconnect
 * Disconnect YouTube account
 */
router.delete('/disconnect', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Find active connection
    const connection = await prisma.socialAccountConnection.findFirst({
      where: {
        userId,
        platform: 'YOUTUBE',
        isActive: true
      }
    });

    if (!connection) {
      return res.status(404).json({ error: 'YouTube connection not found' });
    }

    // Revoke token with YouTube
    await YouTubeAuthService.revokeToken(connection.accessToken);

    // Soft delete: Mark as inactive
    await prisma.socialAccountConnection.update({
      where: { id: connection.id },
      data: {
        isActive: false,
        accessToken: null,
        refreshToken: null
      }
    });

    res.json({ success: true, message: 'YouTube account disconnected' });
  } catch (error) {
    console.error('YouTube disconnect error:', error);
    res.status(500).json({ error: 'Failed to disconnect YouTube account' });
  }
});

/**
 * POST /api/auth/youtube/sync
 * Manually trigger YouTube data sync
 */
router.post('/sync', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Find active connection
    const connection = await prisma.socialAccountConnection.findFirst({
      where: {
        userId,
        platform: 'YOUTUBE',
        isActive: true
      }
    });

    if (!connection) {
      return res.status(404).json({ error: 'YouTube connection not found' });
    }

    // Refresh token if needed (YouTube tokens last ~1 hour)
    await YouTubeAuthService.ensureValidToken(connection);

    // Sync profile
    const profileResult = await YouTubeSyncService.syncProfile(userId, connection.id);

    // Sync videos (last 50)
    const videosResult = await YouTubeSyncService.syncVideos(userId, connection.id, 50);

    res.json({
      success: true,
      profile: profileResult.profile,
      videosCount: videosResult.postsCount
    });
  } catch (error) {
    console.error('YouTube sync error:', error);
    res.status(500).json({ error: error.message || 'Failed to sync YouTube data' });
  }
});

module.exports = router;
