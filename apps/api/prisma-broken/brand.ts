import { Router } from 'express';
import { protect } from '../middleware/authMiddleware';
import { requireBrandRole } from '../middleware/requireBrandRole';
import { isPremiumBrand } from '../middleware/isPremiumBrand';
import {
  getDashboardData,
  createCampaign,
  listCampaigns,
  getCampaignDetails,
  approveDeliverable,
} from '../controllers/brand/portalController';

const router = Router();

// All routes in this file are for brands only
router.use(protect, requireBrandRole);

router.get('/dashboard', getDashboardData);
router.get('/campaigns/list', listCampaigns);
router.get('/campaigns/:id', getCampaignDetails);
router.post('/deliverables/:id/approve', approveDeliverable);

// Premium-only routes
router.post('/campaigns/create', isPremiumBrand, createCampaign);

export default router;