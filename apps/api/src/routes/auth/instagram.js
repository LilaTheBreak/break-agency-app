import express from 'express';
import { InstagramAuthService } from '../../services/instagram/InstagramAuthService.js';
import { InstagramSyncService } from '../../services/instagram/InstagramSyncService.js';
import { requireAuth } from '../../middleware/auth.js';
import prisma from '../../lib/prisma.js';

const router = express.Router();
const instagramAuth = new InstagramAuthService();
const instagramSync = new InstagramSyncService();

/**
 * GET /api/auth/instagram/connect
 * Initiate Instagram OAuth flow
 */
router.get('/connect', requireAuth, (req, res) => {
  try {
    const authUrl = instagramAuth.getAuthorizationUrl(req.userId);
    res.json({ success: true, url: authUrl });
  } catch (error) {
    console.error('Instagram connect error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to initiate Instagram connection',
      message: error.message
    });
  }
});

/**
 * GET /api/auth/instagram/callback
 * Handle Instagram OAuth callback
 */
router.get('/callback', async (req, res) => {
  try {
    const { code, state, error, error_description } = req.query;
    
    // Handle user denial
    if (error) {
      console.log('Instagram auth denied:', error_description);
      return res.redirect('/dashboard?error=instagram_auth_denied');
    }

    if (!code || !state) {
      return res.redirect('/dashboard?error=instagram_auth_failed');
    }

    // Decode state to get userId
    const { userId } = JSON.parse(Buffer.from(state, 'base64').toString());

    // Exchange code for short-lived token
    const shortLivedToken = await instagramAuth.exchangeCodeForToken(code);
    
    // Exchange for long-lived token (60 days)
    const longLivedToken = await instagramAuth.getLongLivedToken(shortLivedToken.access_token);
    
    // Get user profile
    const profile = await instagramAuth.getUserProfile(longLivedToken.access_token);

    // Calculate expiration date
    const expiresAt = new Date(Date.now() + longLivedToken.expires_in * 1000);
    
    // Save connection to database
    const connection = await prisma.socialAccountConnection.upsert({
      where: {
        creatorId_platform: {
          creatorId: userId,
          platform: 'instagram'
        }
      },
      create: {
        id: `ig_${userId}_${Date.now()}`,
        creatorId: userId,
        platform: 'instagram',
        handle: profile.username,
        connected: true,
        accessToken: longLivedToken.access_token,
        expiresAt,
        metadata: {
          accountType: profile.account_type,
          externalId: profile.id
        }
      },
      update: {
        connected: true,
        accessToken: longLivedToken.access_token,
        expiresAt,
        handle: profile.username,
        metadata: {
          accountType: profile.account_type,
          externalId: profile.id
        }
      }
    });

    // Trigger initial sync in background (don't wait)
    instagramSync.syncProfile(connection.id)
      .then(() => instagramSync.syncPosts(connection.id, 10))
      .catch(err => console.error('Initial Instagram sync failed:', err));

    res.redirect('/dashboard?success=instagram_connected');
  } catch (error) {
    console.error('Instagram callback error:', error);
    res.redirect('/dashboard?error=instagram_auth_failed');
  }
});

/**
 * DELETE /api/auth/instagram/disconnect
 * Disconnect Instagram account
 */
router.delete('/disconnect', requireAuth, async (req, res) => {
  try {
    await prisma.socialAccountConnection.updateMany({
      where: {
        creatorId: req.userId,
        platform: 'instagram'
      },
      data: {
        connected: false,
        accessToken: null,
        refreshToken: null,
        expiresAt: null
      }
    });

    res.json({ success: true, message: 'Instagram disconnected successfully' });
  } catch (error) {
    console.error('Instagram disconnect error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to disconnect Instagram' 
    });
  }
});

/**
 * POST /api/auth/instagram/sync
 * Manually trigger sync for connected account
 */
router.post('/sync', requireAuth, async (req, res) => {
  try {
    const connection = await prisma.socialAccountConnection.findFirst({
      where: {
        creatorId: req.userId,
        platform: 'instagram',
        connected: true
      }
    });

    if (!connection) {
      return res.status(404).json({ 
        success: false, 
        error: 'No connected Instagram account found' 
      });
    }

    // Sync profile and posts
    await instagramSync.syncProfile(connection.id);
    const postsResult = await instagramSync.syncPosts(connection.id, 10);

    res.json({ 
      success: true, 
      message: 'Sync completed',
      data: {
        profileSynced: true,
        postsSynced: postsResult.synced,
        totalPosts: postsResult.total
      }
    });
  } catch (error) {
    console.error('Instagram sync error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to sync Instagram data',
      message: error.message
    });
  }
});

export default router;
