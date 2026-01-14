/**
 * Brand Audit Routes
 */

import { Router } from "express";
import {
  addAuditSourceHandler,
  getBrandAuditSourcesHandler,
  getAuditSummaryHandler,
  updateAuditSourceHandler,
  deleteAuditSourceHandler,
} from '../controllers/auditController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// POST /api/brand-audit/:brandId/sources - Add audit source
router.post("/:brandId/sources", requireAuth, addAuditSourceHandler);

// GET /api/brand-audit/:brandId/sources - Get brand audit sources
router.get("/:brandId/sources", requireAuth, getBrandAuditSourcesHandler);

// GET /api/brand-audit/:brandId/summary - Get audit summary
router.get("/:brandId/summary", requireAuth, getAuditSummaryHandler);

// PUT /api/brand-audit/:brandId/sources/:auditSourceId - Update audit source
router.put(
  "/:brandId/sources/:auditSourceId",
  requireAuth,
  updateAuditSourceHandler
);

// DELETE /api/brand-audit/:brandId/sources/:auditSourceId - Delete audit source
router.delete(
  "/:brandId/sources/:auditSourceId",
  requireAuth,
  deleteAuditSourceHandler
);

export default router;
