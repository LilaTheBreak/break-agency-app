/**
 * Brand Routes
 */

import { Router } from "express";
import {
  onboardBrandHandler,
  getBrandHandler,
  getUserBrandsHandler,
  updateBrandHandler,
  listBrandsHandler,
} from '../controllers/brandController';
import { requireAuth } from '../middleware/auth';

const router = Router();

// POST /api/brands/onboard - Onboard new brand
router.post("/onboard", requireAuth, onboardBrandHandler);

// GET /api/brands - List all brands (with pagination)
router.get("/", listBrandsHandler);

// GET /api/brands/my-brands - Get current user's brands
router.get("/my-brands", requireAuth, getUserBrandsHandler);

// GET /api/brands/:brandId - Get brand by ID
router.get("/:brandId", requireAuth, getBrandHandler);

// PUT /api/brands/:brandId - Update brand
router.put("/:brandId", requireAuth, updateBrandHandler);

export default router;
