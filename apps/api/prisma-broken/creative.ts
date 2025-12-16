import { Router } from 'express';
import { protect } from '../../middleware/authMiddleware';
import { requireBrandRole } from '../../middleware/requireBrandRole';
import { isPremiumBrand } from '../../middleware/isPremiumBrand';
import {
  generateCreativePack,
  getCreativePack,
} from '../../controllers/campaign/creativeDirectionController';

const router = Router();

// Generation/regeneration is a premium feature
router.post('/ai/campaign/creative/:campaignId', protect, isPremiumBrand, generateCreativePack);
router.post('/campaigns/:id/creative/regenerate', protect, isPremiumBrand, generateCreativePack);

// All brand roles can view the generated creative pack
router.get('/campaigns/:id/creative', protect, requireBrandRole, getCreativePack);

export default router;