/**
 * Creator Roster Controller
 * Handles brand's saved/shortlisted/active creator lists
 */

import type { Request, Response, NextFunction } from "express";
import * as rosterService from '../services/creatorRosterService';

/**
 * POST /api/roster
 * Add a creator to roster
 */
export async function addToRoster(req: Request, res: Response, next: NextFunction) {
  try {
    const { talentId, status, notes } = req.body;
    const brandId = req.user?.brandId || req.body.brandId;

    if (!brandId || !talentId) {
      return res.status(400).json({ error: "brandId and talentId are required" });
    }

    const entry = await rosterService.addToRoster(brandId, talentId, status, notes);
    res.status(201).json({ ok: true, entry });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/roster/:talentId
 * Remove a creator from roster
 */
export async function removeFromRoster(req: Request, res: Response, next: NextFunction) {
  try {
    const { talentId } = req.params;
    const brandId = req.user?.brandId || req.query.brandId as string;

    if (!brandId) {
      return res.status(400).json({ error: "brandId is required" });
    }

    await rosterService.removeFromRoster(brandId, talentId);
    res.json({ ok: true, message: "Removed from roster" });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/roster/:talentId
 * Update roster entry (change status or notes)
 */
export async function updateRosterEntry(req: Request, res: Response, next: NextFunction) {
  try {
    const { talentId } = req.params;
    const { status, notes } = req.body;
    const brandId = req.user?.brandId || req.body.brandId;

    if (!brandId) {
      return res.status(400).json({ error: "brandId is required" });
    }

    const entry = await rosterService.updateRosterEntry(brandId, talentId, { status, notes });
    res.json({ ok: true, entry });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/roster
 * Get brand's full roster
 */
export async function getBrandRoster(req: Request, res: Response, next: NextFunction) {
  try {
    const brandId = req.user?.brandId || req.query.brandId as string;
    const status = req.query.status as "saved" | "shortlisted" | "active" | undefined;

    if (!brandId) {
      return res.status(400).json({ error: "brandId is required" });
    }

    const roster = await rosterService.getBrandRoster(brandId, { status });
    res.json({ ok: true, roster });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/roster/check/:talentId
 * Check if a talent is in roster
 */
export async function checkInRoster(req: Request, res: Response, next: NextFunction) {
  try {
    const { talentId } = req.params;
    const brandId = req.user?.brandId || req.query.brandId as string;

    if (!brandId) {
      return res.status(400).json({ error: "brandId is required" });
    }

    const inRoster = await rosterService.isInRoster(brandId, talentId);
    res.json({ ok: true, inRoster });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/roster/stats
 * Get roster statistics
 */
export async function getRosterStats(req: Request, res: Response, next: NextFunction) {
  try {
    const brandId = req.user?.brandId || req.query.brandId as string;

    if (!brandId) {
      return res.status(400).json({ error: "brandId is required" });
    }

    const stats = await rosterService.getRosterStats(brandId);
    res.json({ ok: true, stats });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/roster/bulk
 * Bulk add talents to roster
 */
export async function bulkAddToRoster(req: Request, res: Response, next: NextFunction) {
  try {
    const { talentIds, status } = req.body;
    const brandId = req.user?.brandId || req.body.brandId;

    if (!brandId || !talentIds || !Array.isArray(talentIds)) {
      return res.status(400).json({ error: "brandId and talentIds array are required" });
    }

    const result = await rosterService.bulkAddToRoster(brandId, talentIds, status);
    res.json({ ok: true, result });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/roster/sync-active
 * Sync active status based on active deals
 */
export async function syncActiveStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const brandId = req.user?.brandId || req.body.brandId;

    if (!brandId) {
      return res.status(400).json({ error: "brandId is required" });
    }

    const result = await rosterService.syncActiveStatus(brandId);
    res.json({ ok: true, result });
  } catch (error) {
    next(error);
  }
}
