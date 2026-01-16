/**
 * Dashboard Preferences API Route
 * Handles loading and saving user dashboard customizations
 */

import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';
import { logError } from '../lib/logger.js';

const router = express.Router();

/**
 * GET /api/preferences/dashboard
 * Get user's saved dashboard preferences
 */
router.get('/dashboard', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Fetch from UserPreferences table with fallback to defaults
    // Using any cast to work around TypeScript inference issue with newly-added model
    const preferences = await (prisma as any).userPreferences.findUnique({
      where: { userId },
    }).catch(() => null);

    if (preferences) {
      return res.json({
        visibleWidgets: preferences.visibleWidgets,
        widgetOrder: preferences.widgetOrder,
        currentPreset: preferences.currentPreset,
        customized: preferences.customized,
        lastUpdated: preferences.lastUpdated.toISOString()
      });
    }

    // Return defaults for first-time users
    res.json({
      visibleWidgets: ["tasks-due-today", "active-deals", "pending-approvals", "revenue-mtd", "content-performance"],
      widgetOrder: ["tasks-due-today", "active-deals", "pending-approvals", "revenue-mtd", "content-performance"],
      currentPreset: null,
      customized: false,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    logError('Failed to fetch dashboard preferences', error, { userId: (req as any).user?.id });
    res.status(500).json({ error: 'Failed to fetch preferences' });
  }
});

/**
 * POST /api/preferences/dashboard
 * Save user's dashboard preferences
 */
router.post('/dashboard', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { visibleWidgets, widgetOrder, currentPreset, customized } = req.body;

    // Validate request
    if (!Array.isArray(visibleWidgets) || !Array.isArray(widgetOrder)) {
      return res.status(400).json({ 
        error: 'Invalid preferences format',
        message: 'visibleWidgets and widgetOrder must be arrays'
      });
    }

    // Save or update preferences in database
    // Using any cast to work around TypeScript inference issue with newly-added model
    const updated = await (prisma as any).userPreferences.upsert({
      where: { userId },
      update: {
        visibleWidgets,
        widgetOrder,
        currentPreset: currentPreset || null,
        customized: customized || false,
      },
      create: {
        userId,
        visibleWidgets,
        widgetOrder,
        currentPreset: currentPreset || null,
        customized: customized || false,
      },
    });

    res.json({
      success: true,
      message: 'Dashboard preferences saved',
      preferences: {
        visibleWidgets: updated.visibleWidgets,
        widgetOrder: updated.widgetOrder,
        currentPreset: updated.currentPreset,
        customized: updated.customized,
        lastUpdated: updated.lastUpdated.toISOString()
      }
    });
  } catch (error) {
    logError('Failed to save dashboard preferences', error, { userId: (req as any).user?.id });
    res.status(500).json({ error: 'Failed to save preferences' });
  }
});

/**
 * DELETE /api/preferences/dashboard
 * Reset dashboard to defaults
 */
router.delete('/dashboard', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Reset preferences to defaults in database
    // Using any cast to work around TypeScript inference issue with newly-added model
    const reset = await (prisma as any).userPreferences.upsert({
      where: { userId },
      update: {
        visibleWidgets: ["tasks-due-today", "active-deals", "pending-approvals", "revenue-mtd", "content-performance"],
        widgetOrder: ["tasks-due-today", "active-deals", "pending-approvals", "revenue-mtd", "content-performance"],
        currentPreset: null,
        customized: false,
      },
      create: {
        userId,
        visibleWidgets: ["tasks-due-today", "active-deals", "pending-approvals", "revenue-mtd", "content-performance"],
        widgetOrder: ["tasks-due-today", "active-deals", "pending-approvals", "revenue-mtd", "content-performance"],
        currentPreset: null,
        customized: false,
      },
    });

    res.json({
      success: true,
      message: 'Dashboard preferences reset to defaults',
      preferences: {
        visibleWidgets: reset.visibleWidgets,
        widgetOrder: reset.widgetOrder,
        currentPreset: reset.currentPreset,
        customized: reset.customized
      }
    });
  } catch (error) {
    logError('Failed to reset dashboard preferences', error, { userId: (req as any).user?.id });
    res.status(500).json({ error: 'Failed to reset preferences' });
  }
});

export default router;
