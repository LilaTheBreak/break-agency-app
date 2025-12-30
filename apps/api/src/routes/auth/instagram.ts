import { Router, Request, Response } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import prisma from '../../lib/prisma.js';
import axios from 'axios';

const router = Router();

// Environment validation
const INSTAGRAM_CLIENT_ID = process.env.INSTAGRAM_CLIENT_ID;
const INSTAGRAM_CLIENT_SECRET = process.env.INSTAGRAM_CLIENT_SECRET;
const INSTAGRAM_REDIRECT_URI = process.env.INSTAGRAM_REDIRECT_URI;

const isConfigured = Boolean(
  INSTAGRAM_CLIENT_ID && 
  INSTAGRAM_CLIENT_SECRET && 
  INSTAGRAM_REDIRECT_URI
);

if (!isConfigured) {
  console.warn('⚠️  Instagram OAuth not configured. Set INSTAGRAM_CLIENT_ID, INSTAGRAM_CLIENT_SECRET, and INSTAGRAM_REDIRECT_URI');
}

/**
 * GET /api/auth/instagram/connect
 * Initiate Instagram OAuth flow
 */
router.get('/connect', requireAuth, (req: Request, res: Response) => {
  if (!isConfigured) {
    // REMOVED: Instagram OAuth not configured
    return res.status(410).json({ 
      success: false, 
      error: 'Instagram OAuth not configured',
      message: 'INSTAGRAM_CLIENT_ID, INSTAGRAM_CLIENT_SECRET, and INSTAGRAM_REDIRECT_URI must be set'
    });
  }

  try {
    const userId = (req as any).userId;
    const state = Buffer.from(JSON.stringify({ 
      userId, 
      timestamp: Date.now() 
    })).toString('base64');
    
    const scope = 'user_profile,user_media';
    const params = new URLSearchParams({
      client_id: INSTAGRAM_CLIENT_ID!,
      redirect_uri: INSTAGRAM_REDIRECT_URI!,
      scope,
      response_type: 'code',
      state
    });

    const authUrl = `https://api.instagram.com/oauth/authorize?${params.toString()}`;
    res.json({ success: true, url: authUrl });
  } catch (error: any) {
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
router.get('/callback', async (req: Request, res: Response) => {
  if (!isConfigured) {
    return res.redirect('/dashboard?error=instagram_not_configured');
  }

  try {
    const { code, state, error, error_description } = req.query;
    
    // Handle user denial
    if (error) {
      console.log('Instagram auth denied:', error_description);
      return res.redirect('/dashboard?error=instagram_auth_denied');
    }

    if (!code || !state || typeof code !== 'string' || typeof state !== 'string') {
      return res.redirect('/dashboard?error=instagram_auth_failed');
    }

    // Decode state to get userId
    const { userId } = JSON.parse(Buffer.from(state, 'base64').toString());

    // Exchange code for short-lived token
    const tokenResponse = await axios.post('https://api.instagram.com/oauth/access_token', 
      new URLSearchParams({
        client_id: INSTAGRAM_CLIENT_ID!,
        client_secret: INSTAGRAM_CLIENT_SECRET!,
        grant_type: 'authorization_code',
        redirect_uri: INSTAGRAM_REDIRECT_URI!,
        code
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );

    const shortLivedToken = tokenResponse.data.access_token;
    
    // Exchange for long-lived token (60 days)
    const longLivedResponse = await axios.get('https://graph.instagram.com/access_token', {
      params: {
        grant_type: 'ig_exchange_token',
        client_secret: INSTAGRAM_CLIENT_SECRET!,
        access_token: shortLivedToken
      }
    });

    const longLivedToken = longLivedResponse.data.access_token;
    const expiresIn = longLivedResponse.data.expires_in;
    
    // Get user profile
    const profileResponse = await axios.get('https://graph.instagram.com/me', {
      params: {
        fields: 'id,username,account_type,media_count',
        access_token: longLivedToken
      }
    });

    const profile = profileResponse.data;
    const expiresAt = new Date(Date.now() + expiresIn * 1000);
    
    // Save connection to database
    await prisma.socialAccountConnection.upsert({
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
        accessToken: longLivedToken,
        expiresAt,
        metadata: {
          accountType: profile.account_type,
          externalId: profile.id
        }
      },
      update: {
        connected: true,
        accessToken: longLivedToken,
        expiresAt,
        handle: profile.username,
        metadata: {
          accountType: profile.account_type,
          externalId: profile.id
        }
      }
    });

    res.redirect('/dashboard?success=instagram_connected');
  } catch (error: any) {
    console.error('Instagram callback error:', error);
    res.redirect('/dashboard?error=instagram_auth_failed');
  }
});

/**
 * DELETE /api/auth/instagram/disconnect
 * Disconnect Instagram account
 */
router.delete('/disconnect', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    
    await prisma.socialAccountConnection.updateMany({
      where: {
        creatorId: userId,
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
  } catch (error: any) {
    console.error('Instagram disconnect error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to disconnect Instagram' 
    });
  }
});

/**
 * POST /api/auth/instagram/sync
 * Check Instagram connection status
 * NOTE: Full sync not implemented - connection validation only
 */
router.post('/sync', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    
    const connection = await prisma.socialAccountConnection.findFirst({
      where: {
        creatorId: userId,
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

    res.json({ 
      success: true, 
      message: 'Instagram account connected',
      data: {
        handle: connection.handle,
        connected: connection.connected
      }
    });
  } catch (error: any) {
    console.error('Instagram sync check error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to check Instagram connection',
      message: error.message
    });
  }
});

export default router;
