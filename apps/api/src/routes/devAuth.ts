/**
 * Development-only authentication bypass
 * DO NOT USE IN PRODUCTION
 */

import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { createAuthToken, SESSION_COOKIE_NAME } from '../lib/jwt.js';

const router = Router();

// Only enable in development
if (process.env.NODE_ENV !== 'production') {
  
  // POST /api/dev-auth/login - Login as any user by email
  router.post('/login', async (req, res) => {
    try {
      const { email } = req.body;
      console.log('[DEV-AUTH] Login attempt with email:', email);

      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      // Find or create the user
      console.log('[DEV-AUTH] Looking up user...');
      let user = await prisma.user.findUnique({
        where: { email },
      });
      console.log('[DEV-AUTH] User found:', user ? 'YES' : 'NO');

      if (!user) {
        return res.status(404).json({ 
          error: 'User not found',
          hint: 'Run the seed script to create test users'
        });
      }

      // Create auth token
      console.log('[DEV-AUTH] Creating token...');
      const token = createAuthToken({ id: user.id });

      // Set cookie
      const isProduction = process.env.NODE_ENV === 'production';
      res.cookie(SESSION_COOKIE_NAME, token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        ...(isProduction && { domain: process.env.COOKIE_DOMAIN }),
      });

      return res.json({
        success: true,
        token, // Return token so web app can store it in localStorage for Bearer auth
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      });
    } catch (error) {
      console.error('[DEV-AUTH] Login error:', error instanceof Error ? error.message : error);
      console.error('[DEV-AUTH] Error stack:', error instanceof Error ? error.stack : 'N/A');
      return res.status(500).json({ error: 'Login failed' });
    }
  });

  // POST /api/dev-auth/logout - Clear auth cookie
  router.post('/logout', (_req, res) => {
    res.clearCookie(SESSION_COOKIE_NAME);
    return res.json({ success: true });
  });

  // GET /api/dev-auth/me - Get current user
  router.get('/me', async (req, res) => {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        onboardingComplete: true,
      },
    });

    return res.json({ user });
  });

  console.log('[DEV-AUTH] 🔓 Development auth bypass enabled');
  console.log('[DEV-AUTH] Available test users:');
  console.log('[DEV-AUTH]   - creator@thebreakco.com');
  console.log('[DEV-AUTH]   - brand@thebreakco.com');
  console.log('[DEV-AUTH]   - admin@thebreakco.com');
  console.log('[DEV-AUTH] Use: POST /api/dev-auth/login with { "email": "..." }');
}

export default router;
