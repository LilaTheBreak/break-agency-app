/**
 * Duplicate Detection & Merge Endpoints
 *
 * Provides REST API for:
 * - Scanning for duplicate records (Talent, Brands, Deals)
 * - Merging duplicate records safely
 * - Audit tracking of all merge operations
 */

import express, { Request, Response } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { isSuperAdmin } from "../../lib/roleHelpers.js";
import { sendSuccess, sendError } from "../../utils/response.js";
import {
  detectTalentDuplicates,
  detectBrandDuplicates,
  detectDealDuplicates,
} from "../../lib/duplicateDetection.js";
import { performMerge, MergeRequest } from "../../lib/mergeService.js";

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

/**
 * GET /api/admin/duplicates/talent
 * Scan for duplicate talent records
 */
router.get("/talent", async (req: Request, res: Response) => {
  // Check authorization
  if (!isSuperAdmin(req.user!)) {
    return sendError(res, "FORBIDDEN", "Only SUPERADMIN can access duplicate detection", 403);
  }

  try {
    const duplicates = await detectTalentDuplicates();
    return sendSuccess(res, {
      entityType: "talent",
      duplicateGroups: duplicates,
      totalGroups: duplicates.length,
      totalDuplicateRecords: duplicates.reduce(
        (sum, group) => sum + group.candidates.length,
        0
      ),
    });
  } catch (error) {
    return sendError(res, 500, "Failed to scan for talent duplicates", error);
  }
});

/**
 * GET /api/admin/duplicates/brands
 * Scan for duplicate brand records
 */
router.get("/brands", async (req: Request, res: Response) => {
  // Check authorization
  if (!isSuperAdmin(req.user!)) {
    return sendError(res, "FORBIDDEN", "Only SUPERADMIN can access duplicate detection", 403);
  }

  try {
    const duplicates = await detectBrandDuplicates();
    return sendSuccess(res, {
      entityType: "brands",
      duplicateGroups: duplicates,
      totalGroups: duplicates.length,
      totalDuplicateRecords: duplicates.reduce(
        (sum, group) => sum + group.candidates.length,
        0
      ),
    });
  } catch (error) {
    return sendError(res, 500, "Failed to scan for brand duplicates", error);
  }
});

/**
 * GET /api/admin/duplicates/deals
 * Scan for duplicate deal records
 */
router.get("/deals", async (req: Request, res: Response) => {
  // Check authorization
  if (!isSuperAdmin(req.user!)) {
    return sendError(res, "FORBIDDEN", "Only SUPERADMIN can access duplicate detection", 403);
  }

  try {
    const duplicates = await detectDealDuplicates();
    return sendSuccess(res, {
      entityType: "deals",
      duplicateGroups: duplicates,
      totalGroups: duplicates.length,
      totalDuplicateRecords: duplicates.reduce(
        (sum, group) => sum + group.candidates.length,
        0
      ),
    });
  } catch (error) {
    return sendError(res, 500, "Failed to scan for deal duplicates", error);
  }
});

/**
 * POST /api/admin/duplicates/merge
 * Merge duplicate records (requires SUPERADMIN)
 *
 * Body:
 * {
 *   "entityType": "talent" | "brands" | "deals",
 *   "primaryId": "keep-this-id",
 *   "mergeIds": ["merge-this-id", "and-this-id"]
 * }
 */
router.post("/merge", async (req: Request, res: Response) => {
  // Check authorization
  if (!isSuperAdmin(req.user!)) {
    return sendError(res, "FORBIDDEN", "Only SUPERADMIN can merge records", 403);
  }

  try {
    const { entityType, primaryId, mergeIds } = req.body;

    // Validate required fields
    if (!entityType || !primaryId || !mergeIds) {
      return sendError(res, 400, "Missing required fields: entityType, primaryId, mergeIds");
    }

    // Validate entityType
    if (!["talent", "brands", "deals"].includes(entityType)) {
      return sendError(res, 400, "Invalid entityType. Must be 'talent', 'brands', or 'deals'");
    }

    // Validate mergeIds is array
    if (!Array.isArray(mergeIds) || !mergeIds.length) {
      return sendError(res, 400, "mergeIds must be a non-empty array");
    }

    // Perform merge
    const mergeRequest: MergeRequest = { entityType, primaryId, mergeIds };
    const userId = (req as any).user?.id || "unknown";
    const result = await performMerge(mergeRequest, userId);

    return sendSuccess(res, result, 200, "Records merged successfully");
  } catch (error: any) {
    const message = error.message || "Failed to merge records";

    // Handle validation errors
    if (
      message.includes("not found") ||
      message.includes("Cannot merge") ||
      message.includes("No records")
    ) {
      return sendError(res, 400, message);
    }

    return sendError(res, 500, message, error);
  }
});

export default router;
