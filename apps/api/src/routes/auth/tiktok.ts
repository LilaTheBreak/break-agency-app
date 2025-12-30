import { Router, Request, Response } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import prisma from '../../lib/prisma.js';
import axios from 'axios';

const router = Router();

// Environment validation
const TIKTOK_CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY;
const TIKTOK_CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET;
const TIKTOK_REDIRECT_URI = process.env.TIKTOK_REDIRECT_URI;

const isConfigured = Boolean(
  TIKTOK_CLIENT_KEY && 
  TIKTOK_CLIENT_SECRET && 
  TIKTOK_REDIRECT_URI
);

if (!isConfigured) {
  console.warn('⚠️  TikTok OAuth not configured. Set TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET, and TIKTOK_REDIRECT_URI');
}

/**
 * GET /api/auth/tiktok/connect
 * Initiate TikTok OAuth flow
 */
router.get('/connect', requireAuth, (req: Request, res: Response) => {
  // Phase 5: Feature flag check
  const enabled = process.env.TIKTOK_INTEGRATION_ENABLED === "true";
  if (!enabled) {
    return res.status(503).json({
      success: false,
      error: 'TikTok integration is disabled',
      message: 'This feature is currently disabled. Contact an administrator to enable it.',
      code: 'FEATURE_DISABLED'
    });
  }

  if (!isConfigured) {
    // Phase 5: Return clear error when not configured (not 410 Gone)
    return res.status(400).json({ 
      success: false, 
      error: 'TikTok OAuth not configured',
      message: 'TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET, and TIKTOK_REDIRECT_URI must be set',
      code: 'NOT_CONFIGURED'
    });
  }

  try {
    const userId = (req as any).userId;
    const state = Buffer.from(JSON.stringify({ 
      userId, 
      timestamp: Date.now() 
    })).toString('base64');
    
    const scope = 'user.info.basic,video.list';
    
    const params = new URLSearchParams({
      client_key: TIKTOK_CLIENT_KEY!,
      redirect_uri: TIKTOK_REDIRECT_URI!,
      scope,
      response_type: 'code',
      state
    });

    const authUrl = `https://www.tiktok.com/v2/auth/authorize?${params.toString()}`;
    res.json({ success: true, url: authUrl });
  } catch (error: any) {
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
router.get('/callback', async (req: Request, res: Response) => {
  if (!isConfigured) {
    return res.redirect('/dashboard?error=tiktok_not_configured');
  }

  try {
    const { code, state, error, error_description } = req.query;
    
    // Handle user denial or errors
    if (error) {
      console.log('TikTok auth error:', error, error_description);
      return res.redirect('/dashboard?error=tiktok_auth_denied');
    }

    if (!code || !state || typeof code !== 'string' || typeof state !== 'string') {
      return res.redirect('/dashboard?error=tiktok_auth_failed');
    }

    // Decode state to get userId
    const { userId } = JSON.parse(Buffer.from(state, 'base64').toString());

    // Exchange code for access token
    const tokenResponse = await axios.post('https://open.tiktokapis.com/v2/oauth/token/', {
      client_key: TIKTOK_CLIENT_KEY!,
      client_secret: TIKTOK_CLIENT_SECRET!,
      code,
      grant_type: 'authorization_code',
      redirect_uri: TIKTOK_REDIRECT_URI!
    }, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const tokenData = tokenResponse.data.data;
    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;
    const expiresIn = tokenData.expires_in;
    const openId = tokenData.open_id;
    
    // Get user profile
    const profileResponse = await axios.get('https://open.tiktokapis.com/v2/user/info/', {
      params: {
        fields: 'open_id,union_id,avatar_url,display_name,profile_deep_link'
      },
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const profile = profileResponse.data.data.user;

    // Extract username from profile deep link
    const handle = profile.profile_deep_link ? 
      profile.profile_deep_link.match(/@([^?/]+)/)?.[1] : 
      profile.display_name;

    // Calculate expiration date (TikTok tokens typically expire in 24 hours)
    const expiresAt = new Date(Date.now() + expiresIn * 1000);
    
    // Save connection to database
    await prisma.socialAccountConnection.upsert({
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
        accessToken,
        refreshToken,
        expiresAt,
        metadata: {
          openId,
          externalId: profile.open_id
        }
      },
      update: {
        connected: true,
        accessToken,
        refreshToken,
        expiresAt,
        handle: handle || profile.display_name,
        metadata: {
          openId,
          externalId: profile.open_id
        }
      }
    });

    res.redirect('/dashboard?success=tiktok_connected');
  } catch (error: any) {
    console.error('TikTok callback error:', error);
    res.redirect('/dashboard?error=tiktok_auth_failed');
  }
});

/**
 * DELETE /api/auth/tiktok/disconnect
 * Disconnect TikTok account
 */
router.delete('/disconnect', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    
    const connection = await prisma.socialAccountConnection.findFirst({
      where: {
        creatorId: userId,
        platform: 'tiktok',
        connected: true
      }
    });

    if (connection && connection.accessToken && isConfigured) {
      // Try to revoke token with TikTok
      try {
        await axios.post('https://open.tiktokapis.com/v2/oauth/revoke/', {
          client_key: TIKTOK_CLIENT_KEY!,
          client_secret: TIKTOK_CLIENT_SECRET!,
          token: connection.accessToken
        }, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        });
      } catch (err) {
        console.warn('TikTok token revoke failed:', err);
      }
    }

    // Update database
    await prisma.socialAccountConnection.updateMany({
      where: {
        creatorId: userId,
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
  } catch (error: any) {
    console.error('TikTok disconnect error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to disconnect TikTok' 
    });
  }
});

/**
 * POST /api/auth/tiktok/sync
 * Check TikTok connection status and refresh token if needed
 * NOTE: Full sync not implemented - connection validation only
 */
router.post('/sync', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    
    const connection = await prisma.socialAccountConnection.findFirst({
      where: {
        creatorId: userId,
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

    // Check if token needs refresh
    if (connection.expiresAt && connection.expiresAt < new Date() && connection.refreshToken && isConfigured) {
      try {
        console.log('Refreshing expired TikTok token...');
        const refreshResponse = await axios.post('https://open.tiktokapis.com/v2/oauth/token/', {
          client_key: TIKTOK_CLIENT_KEY!,
          client_secret: TIKTOK_CLIENT_SECRET!,
          grant_type: 'refresh_token',
          refresh_token: connection.refreshToken
        }, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        });

        const refreshedData = refreshResponse.data.data;
        
        await prisma.socialAccountConnection.update({
          where: { id: connection.id },
          data: {
            accessToken: refreshedData.access_token,
            refreshToken: refreshedData.refresh_token,
            expiresAt: new Date(Date.now() + refreshedData.expires_in * 1000)
          }
        });
      } catch (error) {
        console.error('Token refresh failed:', error);
      }
    }

    res.json({ 
      success: true, 
      message: 'TikTok account connected',
      data: {
        handle: connection.handle,
        connected: connection.connected,
        tokenExpired: connection.expiresAt ? connection.expiresAt < new Date() : false
      }
    });
  } catch (error: any) {
    console.error('TikTok sync check error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to check TikTok connection',
      message: error.message
    });
  }
});

export default router;
